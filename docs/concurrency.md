# Concurrency, Idempotency & Integrity Guards — mentor Q&A prep

How we keep the POS correct when two requests race — double-clicks, two cashiers on one table, a
payment landing mid-edit. This is the meatiest engineering story to have ready; mentors love it.

> Verified against the code (file paths cited). Deeper rationale: [`ARCHITECTURE.md`](./ARCHITECTURE.md)
> Decision Log (2026-06-13 concurrency entry). Schema/constraints: [`migrations.md`](./migrations.md).

---

## 1. The problem (say this first)

Postgres runs at its default **Read Committed** isolation. That means a classic
**read-then-write (TOCTOU) window**: you read a row, decide based on it, then write — and another
request can change that row in between. If invariants are enforced *only* in app code with that gap,
they break under load:

- Double-click "Pay" → two payments on one order.
- Two cashiers open the same table → two open bills.
- A payment lands while someone edits the order → lost update.
- Retried `POST /api/orders` → duplicate draft.

## 2. The strategy: two layers

1. **App-layer compare-and-swap (CAS)** — the *guard is the write*. Instead of "read, check, write,"
   we write conditionally and check how many rows changed. If zero, someone beat us → return 409.
2. **Database constraints** — partial-unique indexes + CHECK as the net that holds **regardless** of
   which request races, or even a direct SQL write that bypasses the app.

App guards give friendly errors on the hot path; constraints are the backstop. We deliberately did
**not** crank isolation to Serializable (retry-on-abort plumbing + Neon pooler caveats for rare
races) — CAS and `FOR UPDATE` are local and deterministic.

---

## 3. The guards (each one, with the real pattern)

### a) Idempotent order creation — *the table is the dedupe key*
A retry or double-click on "start order" must not create two drafts. We don't use an
Idempotency-Key header; instead a **partial-unique index** makes the table itself the key:

```sql
CREATE UNIQUE INDEX "Order_one_draft_per_table" ON "Order"("tableId") WHERE status = 'DRAFT';
```

`POST /api/orders` racing a duplicate → the DB throws `P2002` (unique violation) → our central
handler (`src/lib/api.ts`) maps it to **409**. The client's `ensureOrder` does create-or-update, so
the happy path reuses the existing draft and the index catches the race.

### b) No double payment — CAS, flip DRAFT→PAID atomically
`src/app/api/orders/[id]/payment/route.ts`:

```ts
const flipped = await tx.order.updateMany({
  where: { id, status: "DRAFT" },   // only if STILL draft
  data: { status: "PAID" },
});
if (flipped.count === 0) throw new ApiError(409, "Order is not payable");
```

Two concurrent payments: one updates 1 row, the other sees `count === 0` → 409. The payment row +
status flip happen in one `$transaction`.

### c) No lost update when editing — CAS inside the transaction
`PATCH /api/orders/[id]` re-asserts DRAFT *inside* the transaction before writing items/totals
(`updateMany({ where: { id, status: "DRAFT" }})`; `count === 0` → 409). So a payment can't slip in
between the read and the write. **Fired kitchen rounds (round > 0) are frozen** — PATCH only replaces
the un-fired (round 0) lines, so editing can never rewrite food already sent to the kitchen.

### d) One open till per cashier — partial-unique + P2002 catch
```sql
CREATE UNIQUE INDEX "PosSession_one_open_per_user" ON "PosSession"("userId") WHERE "closedAt" IS NULL;
```
`getOpenPosSession` (`src/lib/api.ts`) is find-or-create; on a concurrent create it catches `P2002`
and re-reads the winner — so two requests never open two tills.

### e) Kitchen round advance — CAS on the exact state
`POST /api/orders/[id]/kitchen` (advance) only steps a round if it's still where we read it:
```ts
updateMany({ where: { orderId, round, kitchenStatus: current }, data: { kitchenStatus: next } });
// count === 0 → "changed concurrently, retry" (409)
```
Two cooks tapping the same ticket → one wins, the other gets a clean 409.

### f) Void / free table — CAS, only a DRAFT can be voided
`DELETE /api/orders/[id]`: `updateMany({ where: { id, status: "DRAFT" }, data: { status: "CANCELLED" }})`.
If it's already PAID, `count === 0` → 409 (can't void a paid bill).

### g) Admin "last admin" / "last payment method" — `SELECT … FOR UPDATE` in a transaction
The count-then-write window here could let two concurrent demotions both remove the last admin.
Fixed by locking the candidate rows first (`src/app/api/admin/users/[id]/route.ts`,
`.../archive/route.ts`, `.../payment-methods/[method]/route.ts`):
```ts
await db.$transaction(async (tx) => {
  await tx.$queryRaw`SELECT id FROM "User" WHERE role='ADMIN' AND active=true FOR UPDATE`;
  // …count + update, now serialized
});
```
Two concurrent "archive the other admin" calls serialize → one succeeds, one 409, never zero admins.

### h) Money can't go invalid — CHECK constraints (+ app cap)
App caps discount (`total < 0` → 400 in POST/PATCH); the DB enforces it regardless:
```sql
CHECK (discount >= 0 AND discount <= subtotal + tax)   -- Order
CHECK (tax >= 0)                                        -- Product
CHECK (amount > 0)                                      -- Payment
```

---

## 4. Why these choices (rejected alternatives)

- **CAS over Serializable isolation** — Serializable needs retry-on-serialization-failure plumbing
  everywhere and interacts awkwardly with the Neon pooler; our races are low-frequency and
  point-fixable. `updateMany`-guard / `FOR UPDATE` are deterministic and local.
- **Table-as-key over an Idempotency-Key header table** — for orders, "one open bill per table" *is*
  the natural dedupe key; a generic idempotency table would be more moving parts for the same result.
- **Constraints in raw SQL** — Prisma's `schema.prisma` can't express partial-unique or CHECK, so
  they live in the migration SQL (migration `…_concurrency_constraints`).
- **No RLS** — single tenant, single DB role; authz is app-enforced (`requireRole`). See `stack.md`.

---

## 5. Likely mentor questions

- **"What happens if a cashier double-clicks Pay?"** The second click's conditional update matches
  zero rows (status is no longer DRAFT) → 409. Exactly one payment is recorded.
- **"Two waiters open the same table at once?"** The partial-unique index `Order(tableId) WHERE
  status='DRAFT'` lets only one draft exist; the loser gets a 409 and the UI resumes the existing
  bill. (Tables are floor-shared — any waiter serves any table.)
- **"How is order creation idempotent?"** Retries don't duplicate: the client reuses the table's open
  draft (create-or-update), and the DB index rejects a true concurrent duplicate.
- **"What's compare-and-swap here?"** A conditional write — `UPDATE … WHERE id=? AND status='DRAFT'`
  — then check the affected-row count. The check and the write are one atomic statement, so there's
  no read-then-write gap.
- **"Why not just use a higher isolation level?"** We could (Serializable), but it adds retry plumbing
  and pooler caveats for races that are rare and locally fixable. CAS + `FOR UPDATE` is simpler and
  deterministic.
- **"What if someone writes directly to the DB / bypasses your API?"** The CHECK constraints and
  unique indexes still hold — integrity isn't only in app code.
- **"Can you edit an order after the food's being cooked?"** Fired rounds are frozen; you can only
  add/modify un-fired (round 0) lines. Sent food is never rewritten.
- **"Isolation level?"** Postgres default Read Committed — we guard the specific races rather than
  globally serialize.
