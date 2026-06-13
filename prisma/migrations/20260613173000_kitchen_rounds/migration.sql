-- Incremental kitchen rounds. Each OrderItem remembers which fire batch (round) it
-- belongs to and its own cooking state, so new items can be added to an already-sent
-- order as a fresh kitchen ticket without disturbing what's already cooking.
-- Apply with `prisma migrate deploy` (schema owner only — shared Neon). NOT `pnpm db:migrate`.

ALTER TABLE "OrderItem" ADD COLUMN "round" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "OrderItem" ADD COLUMN "kitchenStatus" "KitchenStatus" NOT NULL DEFAULT 'NONE';

-- Backfill: items of orders already sent to the kitchen become round 1 with their
-- order's current kitchen state (so existing tickets keep showing correctly).
UPDATE "OrderItem" oi
SET "round" = 1, "kitchenStatus" = o."kitchenStatus"
FROM "Order" o
WHERE oi."orderId" = o.id AND o."kitchenStatus" <> 'NONE';

CREATE INDEX "OrderItem_kitchenStatus_idx" ON "OrderItem"("kitchenStatus");
