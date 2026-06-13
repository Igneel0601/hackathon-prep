# hackathon-prep

Next.js 16 (App Router) + React 19 + TypeScript + Tailwind, pnpm, Prisma 7 (Postgres/Neon), Auth.js v5.

## Quick start

```bash
git clone git@github.com:Igneel0601/hackathon-prep.git
cd hackathon-prep
pnpm install                 # also generates the Prisma client (postinstall)
cp .env.example .env         # then fill in the values (see below)
pnpm db:migrate              # apply migrations to the DB
pnpm dev                     # http://localhost:3000
```

> Use **pnpm**, not npm/yarn. Need Node 22+.

## Environment

`.env` is gitignored — copy `.env.example` and fill it in. Get the real values from the team (pinned in our chat):

| Var | What |
|-----|------|
| `DATABASE_URL` | Neon **pooled** connection string (app runtime) |
| `DIRECT_URL` | Neon **direct** connection string (migrations) |
| `AUTH_SECRET` | Auth.js secret — generate your own with `npx auth secret` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth creds (for login) |

> Heads up: we share **one** Neon database. Don't run `db:reset` without telling everyone (it wipes shared data).

## Scripts

| Command | Does |
|---------|------|
| `pnpm dev` | dev server |
| `pnpm build` | production build (must pass before merge) |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` (also runs on pre-push) |
| `pnpm db:migrate` | create + apply a migration (**schema owner only** — see TEAM.md) |
| `pnpm db:seed` | seed fixtures (idempotent) |
| `pnpm db:studio` | open Prisma Studio |
| `pnpm db:reset` | ⚠️ drop + re-migrate + reseed (wipes shared data) |

## How we work

- **Branch per change** (`feat/`, `fix/`, `chore/`, `docs/`, `refactor/<thing>`) → PR into `dev` (Copilot auto-reviews). Keep PRs small, merge often. `dev → main` is promoted via PR at demo checkpoints. Direct push to `dev`/`main` is blocked.
- `pnpm build` must pass before merge. Pre-push runs typecheck + checks API docs are updated.
- **Don't edit `prisma/schema.prisma`** unless you own it — request the model change instead.

## Docs

- [`AGENTS.md`](./AGENTS.md) — conventions + rules (read this; Claude/agents follow it)
- [`docs/TEAM.md`](./docs/TEAM.md) — who owns what
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — stack + decision log
- [`docs/apis/`](./docs/apis/) — API route docs
- [`docs/seed/`](./docs/seed/) — known seed data for testing
