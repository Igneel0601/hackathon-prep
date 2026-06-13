/**
 * Resets the Order.number autoincrement sequence to max(number)+1.
 * Run when Neon's sequence falls behind existing data: pnpm tsx scripts/fix-order-sequence.ts
 */
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';

const { parsed: envLocal = {} } = config({ path: '.env.local' });
if (!envLocal.DATABASE_URL) {
  config({ path: '.env' });
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const result = await prisma.$queryRaw<[{ setval: bigint }]>`
    SELECT setval(
      pg_get_serial_sequence('"Order"', 'number'),
      COALESCE((SELECT MAX(number) FROM "Order"), 0) + 1,
      false
    )
  `;
  const newVal = Number(result[0].setval);
  console.log(`✓ Order.number sequence reset — next value will be ${newVal}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
