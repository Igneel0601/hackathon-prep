// Seed script — run with `pnpm db:seed`.
// Keep the inserted records in sync with docs/seed/README.md (tests read that as truth).
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.user.upsert({
    where: { email: "alice@test.com" },
    update: {},
    create: { email: "alice@test.com", name: "Alice" },
  });
}

main()
  .then(() => console.log("✓ seed complete"))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
