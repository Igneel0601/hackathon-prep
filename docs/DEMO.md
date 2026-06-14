# Demo / Jury Prep

Plain English (judges aren't all engineers). Keep current as we build.

## Elevator pitch (1–2 lines)

> A web-based cafe point-of-sale: the cashier takes table orders on one screen, the kitchen sees them live on another, and payment + receipt close the loop — the whole restaurant flow in one app.

## Problem

Small cafes juggle paper tickets, verbal kitchen relays, and a separate card machine. Orders get lost, the kitchen misses items, and there's no record of the shift. They need one simple system from order to payment.

## Solution

One web app with three connected surfaces: a **POS terminal** (cashier), a **Kitchen Display** (cooks), and **payment + receipts** — sharing one live order. Send an order from the terminal and it appears in the kitchen instantly; take payment and the table frees up.

## How it works (plain English)

1. Staff **logs in** (email/password).
2. Picks a **table** from the floor.
3. Builds the **order** — tap products, adjust quantities, apply a discount.
4. **Sends it to the kitchen** — it pops up on the Kitchen Display screen.
5. Kitchen moves it **To Cook → Preparing → Completed**.
6. Cashier **takes payment** (cash / card / UPI), shows **change**, prints the **receipt**.
7. The table is now **free** for the next guest; the order shows in the session list.

## Tech & why

| Choice | Why (1 line) |
|--------|--------------|
| Next.js 16 (App Router) | Server Components + route handlers, full-stack in one repo |
| Prisma 7 + Postgres (Neon) | type-safe DB, hosted, fast to iterate |
| Auth.js — email/password (+ Google) | matches the brief's login; JWT sessions |
| Polling (3s) for Kitchen Display | real-time enough for a cafe, no websocket infra |
| Two statuses per order | payment lifecycle and kitchen progress move independently |

## Demo script (the click-path) — rehearse this

1. Open **two tabs**: `/order` flow (cashier) and **`/kds`** (kitchen).
2. Log in → **Open Table** → pick table 1.
3. Add a couple of products, bump a quantity, set a **discount %**.
4. **Send to Kitchen** → switch to the KDS tab — **the ticket appears live** ← *the wow*.
5. On KDS: **Start Preparing → Mark Complete**.
6. Back on the terminal: **Checkout → Cash**, enter amount → **change shown** → **receipt** (hit Print).
7. Reopen tables — table 1 is **free** again.

## Self-checkout kiosk (add-on)

Open **`/self-checkout`** (no login — could run on a tablet at the door). A guest:

1. Browses the menu and builds a cart.
2. Picks a **free table** (occupied tables aren't shown).
3. Enters their **email** for the receipt.
4. Hits **Place Order** — order goes straight to the kitchen (no cashier step needed), the
   table shows as occupied on the POS, and the guest gets an emailed receipt with the
   **total due**. No payment is taken here — staff collect it at the table as normal.

"Wow" moment: place an order from `/self-checkout` on one device, watch it appear on `/kds`
instantly, then resume it from `/order` to take payment.

**Offline kiosk (with `NEXT_PUBLIC_OFFLINE_MODE=1`):** the door tablet keeps taking orders during
a wifi blip — the UI is the **same online flow**, just offline-capable. Warm it once online, then
DevTools → **Offline** → order + pick a free table + email + Place Order → the confirmation screen is
identical except the order number shows **"#…"** (no server number yet). Reconnect → the order
flushes to the server (idempotent) and the number fills in; it then appears on `/kds`. Edge case
(rare): if that table got taken while offline, the queued order can't be placed on reconnect — it's
dropped and logged server-side (the `#…` simply doesn't resolve).

## What's next (if we had more time)

Admin back-office (manage products/tables in-app instead of seeded), coupons & promotions, a reporting dashboard (revenue, top items), and per-item kitchen tracking.

## Likely jury questions + answers

- **Q: Why this stack?** A: see Decision Log in `ARCHITECTURE.md`.
- **Q: How is the kitchen "live"?** A: the KDS polls the order API every 3s; an order sent from the terminal shows within seconds. We chose polling over websockets — simpler, and a cafe doesn't need millisecond latency.
- **Q: Why two status fields on an order?** A: payment and cooking are independent lifecycles — a table can be eating (kitchen done) but not yet paid, or pay upfront before cooking. One combined status can't express that.
- **Q: What stops a double charge / duplicate order?** A: payment flips DRAFT→PAID atomically (a second attempt gets rejected), and each table has exactly one open draft that we reuse — so retries don't create duplicates.
- **Q: How does a table free up?** A: occupancy is derived — a table is "occupied" while it has an open draft order, and frees the moment that order is paid.
- **Q: Hardest part?** A: keeping the cashier and kitchen views consistent over one shared order (the two-status model + per-table draft persistence).
- **Q: Is it secure?** A: every API route checks the session server-side; the login gate is enforced in the proxy and re-checked per request.
