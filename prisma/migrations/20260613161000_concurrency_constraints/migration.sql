-- Robustness hardening: DB-level invariants the app computes but never enforced.
-- Authored for review; apply with `pnpm db:migrate` (schema owner only — shared Neon).
--
-- PRE-FLIGHT: CHECK constraints fail to apply if existing rows violate them.
-- Before running, confirm these all return 0 rows:
--   SELECT 1 FROM "Order"   WHERE "discount" < 0 OR "discount" > "subtotal" + "tax";
--   SELECT 1 FROM "Product" WHERE "tax" < 0;
--   SELECT 1 FROM "Payment" WHERE "amount" <= 0;
-- And no duplicate open drafts/sessions exist:
--   SELECT "tableId" FROM "Order" WHERE "status" = 'DRAFT' GROUP BY "tableId" HAVING count(*) > 1;
--   SELECT "userId"  FROM "PosSession" WHERE "closedAt" IS NULL GROUP BY "userId" HAVING count(*) > 1;
-- Seed data is already compliant; if a dirty dev DB trips these, `pnpm db:seed` after a reset.

-- One open order per table: the partial-unique index is the real "one draft per
-- table" guarantee + makes POST /api/orders idempotent (retry → P2002 → 409).
CREATE UNIQUE INDEX "Order_one_draft_per_table"
  ON "Order"("tableId") WHERE "status" = 'DRAFT';

-- One open till per cashier (getOpenPosSession is find-or-create with no guard).
CREATE UNIQUE INDEX "PosSession_one_open_per_user"
  ON "PosSession"("userId") WHERE "closedAt" IS NULL;

-- Domain invariants — hold even against a direct SQL write, not just the app.
ALTER TABLE "Order"
  ADD CONSTRAINT "Order_discount_bounds" CHECK ("discount" >= 0 AND "discount" <= "subtotal" + "tax");
ALTER TABLE "Product"
  ADD CONSTRAINT "Product_tax_nonneg" CHECK ("tax" >= 0);
ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_amount_pos" CHECK ("amount" > 0);
