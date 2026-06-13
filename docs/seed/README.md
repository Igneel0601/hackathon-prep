# Seed Data

The **known state** Claude (and humans) can assume when testing. Keep in sync with `prisma/seed.ts`.

- **Seed script:** `prisma/seed.ts` — run with `pnpm db:seed`.
- **Reset + reseed:** `pnpm db:reset` (drops, re-migrates, reseeds — destructive).
- Seeds are **idempotent** (upsert), so `pnpm db:seed` is safe to re-run.

## Known fixtures

Document every record a test might depend on. Update this table whenever `prisma/seed.ts` changes.

### Users
| email | name | role | password (dev) | notes |
|-------|------|------|----------------|-------|
| `admin@test.com` | Admin | ADMIN | `admin123` | backend/admin login |
| `cashier@test.com` | Cashier | EMPLOYEE | `cashier123` | POS terminal login |

> Passwords are bcrypt-hashed by the seed. Dev-only — fine to log in with these locally. Both seed users are `active: true`.

### Kiosk system user
| email | name | role | password | notes |
|-------|------|------|----------|-------|
| `kiosk@cafe.internal` | Self-Checkout Kiosk | EMPLOYEE | none | owns the PosSession self-checkout orders attach to (see `src/lib/kiosk.ts`); never logs in |

### Payment method settings
| method | enabled | upiId |
|--------|---------|-------|
| CASH | yes | — |
| CARD | yes | — |
| UPI | yes | `cafe@okhdfc` |

### Categories
| name | color |
|------|-------|
| Coffee | `#6f4e37` |
| Food | `#e07a3f` |
| Desserts | `#c84b6e` |

### Products
| name | category | price | tax % | sendToKitchen |
|------|----------|------:|------:|:-------------:|
| Espresso | Coffee | 120 | 5 | no |
| Cappuccino | Coffee | 160 | 5 | no |
| Cold Brew | Coffee | 180 | 5 | no |
| Veg Sandwich | Food | 150 | 5 | yes |
| Margherita Pizza | Food | 280 | 5 | yes |
| Chocolate Brownie | Desserts | 110 | 5 | yes |

### Floor & tables
| floor | tables | seats each |
|-------|--------|-----------|
| Ground Floor (`id: seed-floor-ground`) | 1, 2, 3, 4 | 4 |

> No orders seeded — those are created live during the demo. The kiosk user's PosSession is the one exception (seeded so self-checkout works immediately).
