# Seed Data

The **known state** Claude (and humans) can assume when testing. Keep in sync with `prisma/seed.ts`.

- **Seed script:** `prisma/seed.ts` — run with `pnpm db:seed`.
- **Reset + reseed:** `pnpm db:reset` (drops, re-migrates, reseeds — destructive).
- Seeds are **idempotent** (upsert), so `pnpm db:seed` is safe to re-run.

## Known fixtures

Document every record a test might depend on. Update this table whenever `prisma/seed.ts` changes.

> ⚠️ Current data is a PLACEHOLDER — replace once the real models exist.

### Users
| email | name | notes |
|-------|------|-------|
| `alice@test.com` | Alice | starter test user |
