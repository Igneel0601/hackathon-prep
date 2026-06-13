// Seed script — run with `pnpm db:seed`.
// Keep the inserted records in sync with docs/seed/README.md (tests read that as truth).
// Idempotent: safe to re-run (upserts on stable keys).
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // ─── Accounts: one admin, one cashier (dev passwords below) ─────────────────
  const adminHash = await bcrypt.hash("admin123", 10);
  const cashierHash = await bcrypt.hash("cashier123", 10);
  await prisma.user.upsert({
    where: { email: "admin@test.com" },
    update: { role: "ADMIN", passwordHash: adminHash },
    create: { email: "admin@test.com", name: "Admin", role: "ADMIN", passwordHash: adminHash },
  });
  await prisma.user.upsert({
    where: { email: "cashier@test.com" },
    update: { role: "EMPLOYEE", passwordHash: cashierHash },
    create: { email: "cashier@test.com", name: "Cashier", role: "EMPLOYEE", passwordHash: cashierHash },
  });

  // ─── Categories (name is unique → idempotent) ───────────────────────────────
  const coffee = await prisma.category.upsert({
    where: { name: "Coffee" },
    update: { color: "#6f4e37" },
    create: { name: "Coffee", color: "#6f4e37" },
  });
  const food = await prisma.category.upsert({
    where: { name: "Food" },
    update: { color: "#e07a3f" },
    create: { name: "Food", color: "#e07a3f" },
  });
  const desserts = await prisma.category.upsert({
    where: { name: "Desserts" },
    update: { color: "#c84b6e" },
    create: { name: "Desserts", color: "#c84b6e" },
  });

  // ─── Products (no natural unique key → guard by name+category) ───────────────
  const products: Array<{
    name: string;
    price: number;
    tax: number;
    categoryId: string;
    sendToKitchen: boolean;
  }> = [
    { name: "Espresso", price: 120, tax: 5, categoryId: coffee.id, sendToKitchen: false },
    { name: "Cappuccino", price: 160, tax: 5, categoryId: coffee.id, sendToKitchen: false },
    { name: "Cold Brew", price: 180, tax: 5, categoryId: coffee.id, sendToKitchen: false },
    { name: "Veg Sandwich", price: 150, tax: 5, categoryId: food.id, sendToKitchen: true },
    { name: "Margherita Pizza", price: 280, tax: 5, categoryId: food.id, sendToKitchen: true },
    { name: "Chocolate Brownie", price: 110, tax: 5, categoryId: desserts.id, sendToKitchen: true },
  ];
  for (const p of products) {
    const existing = await prisma.product.findFirst({
      where: { name: p.name, categoryId: p.categoryId },
    });
    if (existing) {
      await prisma.product.update({ where: { id: existing.id }, data: p });
    } else {
      await prisma.product.create({ data: p });
    }
  }

  // ─── Floor + tables (floorId+number is unique → idempotent) ──────────────────
  const ground = await prisma.floor.upsert({
    where: { id: "seed-floor-ground" },
    update: { name: "Ground Floor" },
    create: { id: "seed-floor-ground", name: "Ground Floor" },
  });
  for (const number of [1, 2, 3, 4]) {
    await prisma.table.upsert({
      where: { floorId_number: { floorId: ground.id, number } },
      update: { seats: 4, active: true },
      create: { floorId: ground.id, number, seats: 4, active: true },
    });
  }
}

main()
  .then(() => console.log("✓ seed complete"))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
