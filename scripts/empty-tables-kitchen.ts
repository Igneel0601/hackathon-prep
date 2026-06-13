// One-off cleanup: cancel open DRAFT orders (frees every table) and clear the
// active kitchen tickets (TO_COOK/PREPARING → COMPLETED). Shared Neon DB.
// Run: pnpm tsx scripts/empty-tables-kitchen.ts
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function main() {
  const tablesFreed = await db.order.updateMany({
    where: { status: "DRAFT" },
    data: { status: "CANCELLED" },
  });
  const itemsCleared = await db.orderItem.updateMany({
    where: { kitchenStatus: { in: ["TO_COOK", "PREPARING"] } },
    data: { kitchenStatus: "COMPLETED" },
  });
  const ordersCleared = await db.order.updateMany({
    where: { kitchenStatus: { in: ["TO_COOK", "PREPARING"] } },
    data: { kitchenStatus: "COMPLETED" },
  });
  console.log("Cleanup done:", {
    tablesFreed: tablesFreed.count,
    kitchenItemsCleared: itemsCleared.count,
    ordersCleared: ordersCleared.count,
  });
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
