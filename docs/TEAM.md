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

## Feature verticals — Odoo Cafe POS

Split along the MVP spine (see [`SCOPE.md`](./SCOPE.md)) so two people can own the demo end-to-end.

- **Vertical A (Rajat) — Order View + Ordering.** The POS terminal's core screen: floor pop-up → table → Order View (product cards, category tabs, search, cart, qty, order summary). Cash payment + "order marked Paid". Owns the `Order`/`OrderItem`/`Payment` write APIs.
- **Vertical B (Mukund) — Kitchen Display + Orders.** `Send to Kitchen` → KDS screen (separate tab, ticket cards, To Cook → Preparing → Completed, polling). Orders list for the session. Owns the KDS + order-status APIs.
- **Platform (Vaibhav).** `prisma/schema.prisma` (Product, Category, Floor, Table, Order, OrderItem, Payment, Session, Customer), Auth roles (User/admin vs Employee), seed data, integration/merges.
- **Shared/cross-feature UI (Vinayak).** POS shell + top nav, design tokens from the mockup, reusable cards/buttons/modals in `src/components/`, demo polish. Pairs with Rajat/Mukund to skin their screens.

> Add-ons (admin CRUD, coupons, UPI/Card, dashboard, customers) are pulled from `SCOPE.md` **only after** the spine demos clean — assign owners then.

## MVP build split — who does what (everyone builds)

The 5-step spine in [`SCOPE.md`](./SCOPE.md), divided so all four work in parallel.

**Vaibhav — Platform (do FIRST, unblocks A & B).**
- Schema + migration: `Product, Category, Floor, Table, Order, OrderItem, Payment, Session, Customer`.
- Seed: a few products across 2-3 categories, one floor + a couple tables, Cash enabled, one admin + one employee account.
- Auth role gate (admin vs employee); on login, open/resume a POS `Session` and redirect to the terminal.
- Nail the **shared Order contract** (status enum, OrderItem shape) so A writes it and B reads it — see "Shared contract" below. Stub the API routes + `docs/apis/` so A/B build against a fixed shape.

**Rajat (Vertical A) — Order View + Cash payment.**
- Floor pop-up → select table → Order View.
- Product section (cards from API, category tabs, name search) → click adds to cart.
- Cart: qty +/-, line totals, order summary (subtotal / tax / total).
- Persist order as **Draft** (`POST/PATCH` order + items).
- Cash checkout: amount received → change due → mark **Paid** → receipt view.

**Mukund (Vertical B) — Send to Kitchen + Kitchen Display + Orders.**
- `Send to Kitchen` action (sets order → kitchen queue).
- KDS screen at a fixed route (separate tab): ticket cards, **poll every 2-3s**, stages To Cook → Preparing → Completed; clicking a card advances the stage.
- Orders list for the current session (order #, customer, amount, status).

**Vinayak — UI shell + skinning (parallel from hour 0, no DB dependency).**
- shadcn init, app shell + top nav (POS Order, Orders, Table View, employee icon, hamburger).
- Design tokens pulled from the mockup; reusable `ProductCard`, `CartLine`, `TicketCard`, `Modal`, `Button` in `src/components/`.
- Skin Rajat's Order View and Mukund's KDS to match the mockup; login screen + demo polish.

### Sequencing
1. **Hour 0:** Vaibhav ships schema + seed + Order contract; Vinayak starts shell + components (no DB needed).
2. **Once seed lands:** Rajat + Mukund build against seeded data and the fixed contract.
3. **Integration checkpoint:** an order Rajat creates must show on Mukund's KDS — test that handoff early, don't leave it to the end.

### Shared contract (agree before coding — Vaibhav owns)
- `Order.status`: `DRAFT → PAID → CANCELLED` (payment lifecycle).
- `Order.kitchenStatus`: `NONE → TO_COOK → PREPARING → COMPLETED` (set by `Send to Kitchen`, advanced on KDS). Keep it **order-level** for MVP; item-level strikethrough is an add-on.
- `OrderItem`: `productId, name, unitPrice, qty, lineTotal` (snapshot price at add-time).
- Rajat **writes** orders/items + payment; Mukund **reads** + advances `kitchenStatus`. Both go through Vaibhav's API shapes.

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
