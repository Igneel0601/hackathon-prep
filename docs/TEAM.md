# Team & Ownership

4 people: 3 full-stack + 1 frontend. Division is by **layer/ownership** to avoid merge collisions.
Feature verticals get real names once the problem statement is known (see bottom).

## Roles

| Person | Role | Owns |
|--------|------|------|
| **Vaibhav** | Platform / Integrator | `prisma/schema.prisma`, Auth (`src/auth.ts`), CI, deploy, env/secrets, promoting `dev → main`. Tiebreaker on structure. |
| **Rajat** | Feature Vertical A (full slice) | One core feature end-to-end: its API routes (`src/app/api/...`) + its UI. |
| **Mukund** | Feature Vertical B (full slice) | A second core feature end-to-end. |
| **Vinayak** | Frontend / UI system | shadcn setup, layout/nav shell, design tokens, reusable components in `src/components/`, demo polish. Pairs with Rajat/Mukund to skin their features. |

## Rules that prevent collisions

- **`prisma/schema.prisma` is Vaibhav-only.** Need a model/field? Ask Vaibhav — he adds it and runs the migration. Multiple editors on the schema = merge conflicts + broken migrations.
- **Branch per change** (`feat/`, `fix/`, `chore/`, `docs/`, `refactor/<thing>`) → PR into `dev`. Small PRs, merge often. `dev → main` is a promotion PR at checkpoints (use a merge commit, not squash). Direct push to `dev`/`main` blocked. Don't push broken builds.
- **Each vertical owns its docs** — `docs/apis/<path>/route.md` per route (enforced by the `doc-sync` CI check on every PR).
- **Shared UI lives in `src/components/`** (Vinayak's). Verticals import, don't rebuild.

## Migrations (shared Neon DB)

Everyone points at the **same Neon database**, so migrations are tightly owned.

- **Only Vaibhav runs `pnpm db:migrate`** (`prisma migrate dev`) — and only when `prisma/schema.prisma` changes. It creates a migration file + applies it to Neon.
- Vaibhav **commits the migration file** (`prisma/migrations/...`). It's the source of truth; the generated client is gitignored and rebuilt by `postinstall`.
- **Teammates never run migrate.** After a schema change: `git pull` + `pnpm install` (auto-regenerates the client). Tables already exist in the shared DB.
- **`pnpm db:reset` wipes shared data** — Vaibhav only, warn the team first, then `pnpm db:seed` to restore fixtures.
- Deploy pipeline uses `prisma migrate deploy` (applies committed migrations; never creates).
- Connections: app/runtime uses pooled `DATABASE_URL`; migrations use direct `DIRECT_URL`.

## Cross-cutting ownership

- **Deploy** → Vaibhav (deploy a hello-world early; then it's just `git push`).
- **Demo / pitch** → Vinayak leads (owns what judges see) + owner of the hero feature.
- **Onboarding README** → Vaibhav.

## Feature verticals — TBD

Fill once the problem statement lands:

- **Vertical A (Rajat):** _TBD_
- **Vertical B (Mukund):** _TBD_
- Shared/cross-feature UI (Vinayak): _TBD_

## Who built what

In the mentoring round, **mentors ask each person what they built and quiz them on it.**
Keep this log current as features ship — it's everyone's prep sheet.

| Feature / area | Owner | Notes |
|----------------|-------|-------|
| Project scaffold, DB, Auth, CI | Vaibhav | platform/infra |
| _TBD_ | _TBD_ | |

## Understand your own code

Heavy Claude use is fine — **but you own what you ship.**

- If your name's on it, you must be able to **explain it without notes**: what it does, how, and why.
- **Review your agent's output before committing** — don't blind-merge AI code you can't defend.
- Know your slice's **data model + flow** — that's what mentors drill into.
