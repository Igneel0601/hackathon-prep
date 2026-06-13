-- Robustness hardening: DB-level invariants the app computes but never enforced.
-- Apply with `prisma migrate deploy` (schema owner only — shared Neon). Prisma wraps
-- this whole file in ONE transaction, so the LOCK + de-dupe + index build are atomic.
--
-- Why the LOCK: the shared DB has concurrent writers (teammates' POS instances). A
-- plain "clean the dupes, then CREATE UNIQUE INDEX" loses the race — a new DRAFT can
-- be inserted in the gap and the index build fails (23505). Taking SHARE locks blocks
-- writes (reads still fine) for the ~1s this runs, so no row sneaks in between the
-- de-dupe and the index. Writers resume the instant we commit — now bounded by the
-- index (a 2nd open draft → P2002 → the app's friendly 409).
--
-- The de-dupe keeps the NEWEST open row per group and cancels/closes the rest — the
-- exact state the app's "one draft per table / one open till" rule intends. This is a
-- one-time data repair co-located with the constraint that prevents the mess recurring.

-- ── One open order per table ────────────────────────────────────────────────
LOCK TABLE "Order" IN SHARE MODE;

UPDATE "Order" SET status = 'CANCELLED'
WHERE status = 'DRAFT' AND id NOT IN (
  SELECT DISTINCT ON ("tableId") id FROM "Order"
  WHERE status = 'DRAFT' ORDER BY "tableId", "createdAt" DESC
);

CREATE UNIQUE INDEX "Order_one_draft_per_table"
  ON "Order"("tableId") WHERE "status" = 'DRAFT';

-- ── One open till per cashier ───────────────────────────────────────────────
LOCK TABLE "PosSession" IN SHARE MODE;

UPDATE "PosSession" SET "closedAt" = now()
WHERE "closedAt" IS NULL AND id NOT IN (
  SELECT DISTINCT ON ("userId") id FROM "PosSession"
  WHERE "closedAt" IS NULL ORDER BY "userId", "openedAt" DESC
);

CREATE UNIQUE INDEX "PosSession_one_open_per_user"
  ON "PosSession"("userId") WHERE "closedAt" IS NULL;

-- ── Domain invariants — hold even against a direct SQL write ─────────────────
ALTER TABLE "Order"
  ADD CONSTRAINT "Order_discount_bounds" CHECK ("discount" >= 0 AND "discount" <= "subtotal" + "tax");
ALTER TABLE "Product"
  ADD CONSTRAINT "Product_tax_nonneg" CHECK ("tax" >= 0);
ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_amount_pos" CHECK ("amount" > 0);
