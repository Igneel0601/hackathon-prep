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

- **Vertical A (Rajat) — Order View + Ordering UI.** The POS terminal's core screen: floor pop-up → table → Order View (product cards, category tabs, search, cart, qty, order summary). Cash payment + "order marked Paid". Consumes Vaibhav's order/payment endpoints (see plan-aware split below).
- **Vertical B (Mukund) — Kitchen Display + Orders UI.** `Send to Kitchen` → KDS screen (separate tab, ticket cards, To Cook → Preparing → Completed, polling). Orders list for the session. Consumes Vaibhav's status/orders endpoints.
- **Platform + API layer (Vaibhav).** `prisma/schema.prisma`, Auth roles, seed, **and all API routes / server actions** the Pro screens consume (orders, payments, KDS status, reads), each with its `docs/apis/` contract. Integration/merges/review. (Max 5x absorbs the Claude-heavy backend — see split below.)
- **Shared/cross-feature UI (Vinayak).** POS shell + top nav, design tokens from the mockup, reusable cards/buttons/modals in `src/components/`, demo polish. Pairs with Rajat/Mukund to skin their screens.

> Add-ons (admin CRUD, coupons, UPI/Card, dashboard, customers) are pulled from `SCOPE.md` **only after** the spine demos clean — assign owners then.

## MVP build split — who does what (everyone builds)

The 5-step spine in [`SCOPE.md`](./SCOPE.md), divided so all four work in parallel.

> **Plan-aware distribution.** Vaibhav is on **Claude Max 5x**; everyone else is on **Pro**.
> So the Claude-heavy, wide-context, cross-cutting work (the **API/data layer** + integration
> + PR review) lands on the Max budget. Pro users each own **one UI screen** built against a
> **fixed `docs/apis/` contract** — small surface, short sessions, low context = fits Pro limits.
> They consume endpoints; they don't need the backend in context.

**Vaibhav — Platform + API layer (Max 5x; do API stubs FIRST, unblocks everyone).**
- Schema + migration ✅ (done) + seed ✅.
- **All API routes / server actions** the Pro screens consume: orders + items (create/update Draft), payment (Cash → Paid), `Send to Kitchen` + KDS status advance, and read endpoints (products by category, tables/floors, session orders).
- Each route ships with its `docs/apis/<path>/route.md` contract **before** the Pro user starts — that contract is all they need.
- Auth role gate (admin vs employee); on login open/resume a POS `Session` and redirect to the terminal.
- Integration glue + reviewing every PR + firefighting. This is where the Max budget goes.

**Rajat (Pro) — Order View UI.** Consumes Vaibhav's order/payment endpoints.
- Floor pop-up → select table → Order View.
- Product section (cards, category tabs, name search) → click adds to cart.
- Cart: qty +/-, line totals, order summary (subtotal / tax / total).
- Cash checkout UI: amount received → change due → mark Paid → receipt view.
- _Builds against `docs/apis/` — does not need to read the backend._

**Mukund (Pro) — KDS + Orders UI.** Consumes Vaibhav's status/orders endpoints.
- `Send to Kitchen` button (calls the status endpoint).
- KDS screen at a fixed route (separate tab): ticket cards, **poll every 2-3s**, stages To Cook → Preparing → Completed; clicking a card advances the stage.
- Orders list for the current session (order #, customer, amount, status).
- _Builds against `docs/apis/` — does not need to read the backend._

**Vinayak (Pro) — UI shell + components (cheapest sessions; no backend at all).**
- shadcn init, app shell + top nav (POS Order, Orders, Table View, employee icon, hamburger).
- Design tokens from the mockup; reusable `ProductCard`, `CartLine`, `TicketCard`, `Modal`, `Button` in `src/components/`.
- Skin Rajat's Order View and Mukund's KDS to match the mockup; login screen + demo polish.

### Pro-budget tips (pass to the team)
- Build against the `docs/apis/` contract — Claude needn't read backend code.
- `AGENTS.md` is auto-loaded; don't re-explain conventions each session.
- One screen per branch, small PRs → short review loops, less re-reading.

### Sequencing
1. **Hour 0:** Vaibhav (Max) ships the API stubs + `docs/apis/` contracts; Vinayak starts shell + components (no DB needed).
2. **Once seed lands:** Rajat + Mukund build against seeded data and the fixed contract.
3. **Integration checkpoint:** an order Rajat creates must show on Mukund's KDS — test that handoff early, don't leave it to the end.

### Shared contract (agree before coding — Vaibhav owns)
- `Order.status`: `DRAFT → PAID → CANCELLED` (payment lifecycle).
- `Order.kitchenStatus`: `NONE → TO_COOK → PREPARING → COMPLETED` (set by `Send to Kitchen`, advanced on KDS). Keep it **order-level** for MVP; item-level strikethrough is an add-on.
- `OrderItem`: `productId, name, unitPrice, qty, lineTotal` (snapshot price at add-time).
- Rajat **writes** orders/items + payment; Mukund **reads** + advances `kitchenStatus`. Both go through Vaibhav's API shapes.

## MVP file-ownership map (no-conflict)

**Rule: one branch = a disjoint set of files. Never edit a file someone else owns.**
Feature-specific components live colocated in the owner's route folder (`_components/`), never in shared `src/components/`.

| Owner | Owns these paths | Builds |
|-------|------------------|--------|
| **Vaibhav** | `src/lib/api-types.ts`, `src/lib/api-client.ts`, `middleware.ts`, `src/app/layout.tsx` (SessionProvider), `src/app/providers.tsx`, `src/app/login/page.tsx` | typed API client, auth gating, login |
| **Vinayak** | `src/components/**`, `src/app/(pos)/layout.tsx`, `src/app/globals.css`, `tailwind`/`components.json`, `package.json` (UI deps) | **design (Claude Design)** + shell/nav + shared primitives |
| **Rajat** | `src/app/(pos)/page.tsx`, `src/app/(pos)/order/_components/**`, `…/order/_hooks/**` | Order View: floor picker, product grid, cart, cash checkout |
| **Mukund** | `src/app/kds/**` (own layout+page), `src/app/(pos)/orders/page.tsx`, their `_components/`/`_hooks/` | KDS (separate tab), Orders list |

**Only 3 collision points — all avoided:**
1. `src/components/` → Vinayak-only. Others import, never add (their parts go in their route's `_components/`).
2. `package.json`/lockfile → only Vinayak touches it (UI deps). `api-types`/`api-client` are pure TS (no deps).
3. Layouts → root `layout.tsx` = Vaibhav (SessionProvider only); `(pos)/layout.tsx` = Vinayak. Different files; pages render inside but never edit them.

**Wave order:**
- **Wave 0 (now, parallel):** Vaibhav `feat/api-types` (merge first — everyone imports it) + `feat/auth-shell`; Vinayak designs in Claude Design.
- **Wave 1 (after api-types on `dev`):** Rajat `feat/order-view`, Mukund `feat/kitchen-display` — zero shared files, merge in any order.

## Design runs in parallel — wire against dummy UI

Vinayak **designs** the screens (Claude Design); Rajat/Mukund **wire data now** against plain dummy UIs, then swap in the finished design. The integration seam is the **component inventory + props** — agree these, build to them on both sides, and swap-in is a reskin, not a rewrite.

**Lock these component boundaries (money props are `string` — Decimal-as-string from the API):**

| Component | Props |
|-----------|-------|
| `TableCard` | `{ number, seats, status: 'available' \| 'active', onClick }` |
| `FloorPickerModal` | `{ floors, onSelectTable }` |
| `CategoryTabs` | `{ categories: {id,name,color}[], active, onChange }` |
| `ProductCard` | `{ name, price: string, categoryColor, onClick }` |
| `CartLine` | `{ name, qty, unitPrice: string, lineTotal: string, onInc, onDec }` |
| `OrderSummary` | `{ subtotal, tax, discount, total }` (all `string`) |
| `PaymentModal` | `{ total: string, methods, onConfirm }` |
| `TicketCard` | `{ number, items: {name,qty}[], status, onAdvance }` |

Rajat/Mukund build these as plain HTML + minimal Tailwind with **real props + real wiring**; replace internals with Vinayak's design later, props unchanged. Pages to design + screen list: see [`docs/design/README.md`](./design/README.md).

## Who built what

In the mentoring round, **mentors ask each person what they built and quiz them on it.**
Keep this log current as features ship — it's everyone's prep sheet.

| Feature / area | Owner | Notes |
|----------------|-------|-------|
| Project scaffold, DB, Auth, CI | Vaibhav | platform/infra |
| POS data model (schema + migrations) | Vaibhav | 9 models + enums |
| POS API layer (all routes) | Vaibhav | products, tables, orders, payment, kitchen |
| Auth — email/password + Google, JWT + auth shell | Vaibhav | Credentials + signup + middleware/login |
| API client + types, integration, PR review | Vaibhav | `src/lib/api-*`; merges + conflict resolution |
| Per-table order persistence (resume/ensureOrder) | Vaibhav | one draft per table; idempotency fix |
| Admin backend — Products & Categories CRUD + authz | Vaibhav | role-gated `/admin`, validate.ts, archive policy |
| Admin backend — Booking, Payment Methods, Users | Vaibhav | toggles + UPI QR + POS consumption; user guards |
| Order View — floor picker, cart, checkout, receipt | Rajat | products grid, qty, discount, cash/card/upi, print |
| Kitchen Display (KDS) | Rajat | live polling, stage advance |
| Session orders list + home nav | Rajat | `/orders`, `/kds` buttons |
| Manual QA (browser testing) | Mukund | `docs/mukund.md`; bug reports + verification |
| Design + UI shell/components | Vinayak | _in progress_ (Claude Design) |

## Understand your own code

Heavy Claude use is fine — **but you own what you ship.**

- If your name's on it, you must be able to **explain it without notes**: what it does, how, and why.
- **Review your agent's output before committing** — don't blind-merge AI code you can't defend.
- Know your slice's **data model + flow** — that's what mentors drill into.
