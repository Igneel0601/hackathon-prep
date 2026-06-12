# Seed Data

The **known state** Claude (and humans) can assume when testing. Keep this in sync with the seed script.

- **Seed script:** _TBD_ (e.g. `scripts/seed.ts`) — run with `pnpm seed` once added.
- **Reset:** how to wipe + reseed — _TBD_.

## Known fixtures

Document every record a test might depend on. Example shape:

### Users
| id | email | password | role | notes |
|----|-------|----------|------|-------|
| _TBD_ | `alice@test.com` | `test1234` | user | has sample data |

### <other entities>
| id | … | notes |
|----|---|-------|
| _TBD_ | | |

> When you change the seed script, update this table in the same change — tests read it as the source of truth.
