# Team & Ownership

4 people: 3 full-stack + 1 frontend. Division is by **layer/ownership** to avoid merge collisions.
Feature verticals get real names once the problem statement is known (see bottom).

## Roles

| Person | Role | Owns |
|--------|------|------|
| **Vaibhav** | Platform / Integrator | `prisma/schema.prisma`, Auth (`src/auth.ts`), CI, deploy, env/secrets, merging branches into `main`. Tiebreaker on structure. |
| **Rajat** | Feature Vertical A (full slice) | One core feature end-to-end: its API routes (`src/app/api/...`) + its UI. |
| **Mukund** | Feature Vertical B (full slice) | A second core feature end-to-end. |
| **Vinayak** | Frontend / UI system | shadcn setup, layout/nav shell, design tokens, reusable components in `src/components/`, demo polish. Pairs with Rajat/Mukund to skin their features. |

## Rules that prevent collisions

- **`prisma/schema.prisma` is Vaibhav-only.** Need a model/field? Ask Vaibhav — he adds it and runs the migration. Multiple editors on the schema = merge conflicts + broken migrations.
- **Branch per feature** (`feat/<thing>`), PR into `main`. Small PRs, merge often. Don't push broken builds to `main`.
- **Each vertical owns its docs** — `docs/apis/<path>/route.md` per route (enforced by the pre-push hook).
- **Shared UI lives in `src/components/`** (Vinayak's). Verticals import, don't rebuild.

## Cross-cutting ownership

- **Deploy** → Vaibhav (deploy a hello-world early; then it's just `git push`).
- **Demo / pitch** → Vinayak leads (owns what judges see) + owner of the hero feature.
- **Onboarding README** → Vaibhav.

## Feature verticals — TBD

Fill once the problem statement lands:

- **Vertical A (Rajat):** _TBD_
- **Vertical B (Mukund):** _TBD_
- Shared/cross-feature UI (Vinayak): _TBD_
