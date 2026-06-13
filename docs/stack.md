# Stack — mentor Q&A prep

Everything about our stack a mentor might ask, with answers you can give cold. Three pillars:
**Next.js** (full-stack framework) · **Prisma** (ORM) · **PostgreSQL** (database, hosted on Neon).

> Deeper "why we chose X" rationale lives in [`ARCHITECTURE.md`](./ARCHITECTURE.md) Decision Log.
> This doc is the talking-points version.

---

## 0. Stack at a glance

| Layer | Choice | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.9 |
| UI | React | 19.2.4 |
| Language | TypeScript | 5.x (strict) |
| Styling | Tailwind CSS | 4 |
| ORM | Prisma (engine-less + `@prisma/adapter-pg`) | 7.8 |
| Database | PostgreSQL on **Neon** (serverless, hosted) | 16/17 |
| Driver | `pg` (node-postgres) | 8.x |
| Auth | Auth.js (NextAuth v5), JWT sessions | 5.0.0-beta |
| Package manager | pnpm | — |

**One-line pitch:** "It's a single TypeScript codebase — Next.js renders the UI and serves the API, Prisma is our type-safe data layer, and the data lives in a hosted Postgres on Neon. End-to-end type safety from the DB schema to the React component."

---

## 1. Next.js (App Router)

### What it is
A full-stack React framework. We use the **App Router** (the `src/app/` directory), where the
framework decides on the server vs. the client per-component.

### How we use it
- **Server Components by default.** Pages fetch data on the server (calling Prisma directly) and
  send HTML; we only add `"use client"` for components that need state, effects, or browser APIs
  (the cart, the KDS poller, the table picker).
- **Route Handlers** = our API. `src/app/api/<path>/route.ts` exports `GET`/`POST`/`PATCH`/`DELETE`.
  e.g. `POST /api/orders`, `DELETE /api/orders/[id]` (void), `GET /api/kitchen` (KDS tickets).
- **File-based routing.** A folder with `page.tsx` is a route; `layout.tsx` is a shared shell.
  Routes: `/login`, `/tables`, `/order`, `/orders`, `/kds`, `/admin/*`.
- **`src/app/admin/layout.tsx`** is a Server Component that does the authoritative role check
  (`auth()` → redirect non-ADMIN) — security on the server, not just hidden buttons.
- **Proxy** (Next 16's renamed middleware, `src/proxy.ts`) does cookie-level auth gating at the edge.

### Why Next.js (not a separate SPA + API)
One repo, one language, one deploy. Server Components cut the API surface and ship less JS;
data-fetching happens next to the DB. Rejected: Pages Router (legacy), React SPA + separate
Express API (more glue, two deploys, CORS).

### Likely mentor questions
- **"Server Components vs Client Components — what's the difference?"**
  Server Components run only on the server, can be `async`, can hit the DB/secrets directly, and
  ship zero JS to the browser. Client Components (`"use client"`) run in the browser for
  interactivity (state/effects). We keep client components small and leaf-level.
- **"How does the frontend talk to the backend?"** Two ways: (1) Server Components call Prisma
  directly during render; (2) Client Components `fetch` our Route Handlers (`/api/*`). Mutations
  go through Route Handlers, not client-to-client.
- **"Is rendering SSR, SSG, or client?"** App Router is hybrid — static where possible, dynamic
  (server-rendered per request) for authenticated/data-driven pages. Our POS pages are dynamic.
- **"Where do secrets live?"** `.env.local` / `.env` (gitignored): `DATABASE_URL`, `AUTH_SECRET`,
  Google OAuth keys. Never shipped to the client; only Server Components / Route Handlers read them.

---

## 2. React 19 + TypeScript + Tailwind (briefly)

- **React 19** — component model; we use hooks (`useReducer` for the cart/order state machines,
  `useState`, `useEffect` for the KDS 3s poller).
- **TypeScript strict** — no implicit `any`. The win: Prisma generates types from the schema, so a
  DB column rename surfaces as a compile error in the component. End-to-end type safety.
- **Tailwind CSS 4** — utility-first styling, no separate CSS files. Design tokens (espresso / gold
  / cream) applied inline + via CSS vars.

---

## 3. Prisma (ORM)

### What it is
A **type-safe ORM**: we define the data model once in `prisma/schema.prisma`, Prisma generates a
fully-typed client, and we write `db.order.findMany(...)` instead of raw SQL — with autocomplete
and compile-time checking.

### How we use it
- **Schema** (`prisma/schema.prisma`) is the single source of truth: models `User`, `Category`,
  `Product`, `Floor`, `Table`, `Customer`, `PosSession`, `Order`, `OrderItem`, `Payment`,
  `PaymentMethodSetting` + enums (`Role`, `OrderStatus`, `KitchenStatus`, `PaymentMethod`).
- **Generated client** lives at `src/generated/prisma` (not `node_modules`), imported via a
  **singleton** in `src/lib/db.ts` so Next.js hot-reload doesn't open a new pool every reload.
- **Migrations** are committed in `prisma/migrations/` (versioned SQL). Seed script is
  `prisma/seed.ts` (`pnpm db:seed`, idempotent).
- **Money is `Decimal(10,2)`**, never float — serialized to string over the API. Avoids rounding
  bugs at tax/checkout.
- **`OrderItem` snapshots `name` + `unitPrice`** so editing a product's price later never rewrites
  past receipts.

### Prisma 7 specifics (a likely "gotcha" question)
Prisma 7 is **engine-less** — the old Rust query engine binary is gone. It now requires a **driver
adapter**: we use **`@prisma/adapter-pg`** over the **`pg`** (node-postgres) driver. That's why
`db.ts` does `new PrismaPg({ connectionString })` and passes `{ adapter }` to `PrismaClient`.

### `migrate dev` vs `migrate deploy` (know this cold — we got bitten)
- `prisma migrate dev` (= our `pnpm db:migrate`) is for **local dev**; it can **reset the database**
  if it detects drift or un-representable objects. **Dangerous on the shared DB.**
- `prisma migrate deploy` applies **pending migrations only**, never resets. **This is what we run
  against the shared Neon DB.** Only the schema owner (Vaibhav) runs migrations.
- Some objects (partial-unique indexes, `CHECK` constraints) can't be expressed in `schema.prisma`,
  so they live as **raw SQL inside migration files**.

### Why Prisma (not Drizzle / raw SQL)
Type safety + autocomplete, schema self-documents the data model, built-in migrations + seeding.
Rejected: Drizzle (lighter but the team/tooling knows Prisma better), raw SQL (no type safety).

### Likely mentor questions
- **"What's an ORM and why use one?"** It maps DB tables ↔ typed objects so you write
  `db.order.create(...)` instead of SQL strings — fewer bugs, refactor-safe, autocomplete. Trade-off:
  a layer of abstraction; for hot/complex queries you can drop to raw SQL (`$queryRaw`).
- **"How do migrations work?"** Change `schema.prisma` → generate a migration (SQL diff) → it's
  committed → applied with `migrate deploy`. History is append-only; we never rewrite old migrations.
- **"How do you prevent N+1 queries?"** Prisma `include`/`select` fetch relations in batched queries
  (e.g. an order with its items + customer in one round trip); the KDS query pulls orders + filtered
  items in a single query.
- **"Decimal vs float for money?"** Decimal — floats can't represent 0.10 exactly, so tax/totals
  drift. We use `Decimal(10,2)` and serialize as strings.

---

## 4. PostgreSQL (on Neon)

### What it is
Our relational database — a managed **PostgreSQL** instance on **Neon** (serverless Postgres,
free tier, no local Docker). One shared DB the whole team develops against.

### How we use it
- **Connection:** `DATABASE_URL` (pooled — Neon's `-pooler` host, for app queries) and `DIRECT_URL`
  (direct, for migrations). Pooling matters because serverless/many connections can exhaust Postgres.
- **Isolation level:** Postgres default **Read Committed**. We don't crank it to Serializable;
  instead we guard the few real races with application-layer **compare-and-swap (CAS)** and DB
  constraints (below).
- **Constraints as the integrity net** (migration `20260613161000_concurrency_constraints`):
  - **Partial-unique index** `Order(tableId) WHERE status='DRAFT'` → exactly one open order per
    table (also makes `POST /api/orders` idempotent — a duplicate races to a `P2002` → 409).
  - **Partial-unique** `PosSession(userId) WHERE closedAt IS NULL` → one open till per cashier.
  - **CHECK constraints**: `discount ≤ subtotal+tax`, `tax ≥ 0`, `payment.amount > 0`.
- **Indexes** on hot lookups (`Order.tableId`, `OrderItem.orderId`, `OrderItem.kitchenStatus`).

### Why PostgreSQL
Relational data with clear relationships (orders → items → products, floors → tables), strong
integrity guarantees (FKs, unique/partial-unique, CHECK), transactions. Neon gives us a hosted
instance with zero ops. Rejected: a local SQLite/Docker DB (team can't share state), a NoSQL store
(our data is relational — joins everywhere).

### Likely mentor questions
- **"Why SQL/Postgres over NoSQL (Mongo)?"** Our domain is relational: an order has many items,
  each item references a product, tables belong to floors. We want FKs, joins, and transactional
  integrity (you can't half-pay an order). Postgres also gives partial-unique indexes + CHECK
  constraints we lean on.
- **"How do you handle two cashiers hitting the same order? / double payment?"**
  Read Committed + **compare-and-swap**: the write is the guard. e.g. paying does
  `updateMany({ where: { id, status: "DRAFT" }, data: {...} })` — if another request already paid,
  `count === 0` and we 409. The order's `status` is effectively a single-use token: it flips
  `DRAFT→PAID` once, so a second payment matches zero rows and never inserts a `Payment`. (There's
  no unique constraint on `Payment` itself — the CAS *is* the guarantee.) Same pattern for editing a
  draft and advancing a kitchen round. A *separate* race — two cashiers opening the **same table** —
  is backstopped at the DB level by the partial-unique index `Order(tableId) WHERE status='DRAFT'`
  (one open bill per table), which holds even against a direct SQL write.
- **"Why not Row-Level Security (RLS)?"** RLS isolates *different owners'* rows when *multiple DB
  roles* hit the database. We're **one cafe (single tenant)** reached by **one Postgres role** (the
  single `DATABASE_URL`). Many *app* users (ADMIN/EMPLOYEE) is an app-layer fact handled by
  `requireRole`, not a DB-tenancy fact. So our access control is app-enforced authorization and our
  integrity net is constraints — RLS would re-implement role checks in SQL for zero isolation gain.
  This flips only if we go multi-cafe in one DB (add `cafeId` + an RLS policy).
- **"Pooled vs direct connection?"** App traffic uses the pooled URL (Neon pooler) so many concurrent
  serverless requests don't exhaust connections; migrations use the direct URL.
- **"Transactions?"** Yes — `db.$transaction(...)` wraps multi-step writes (e.g. recompute totals +
  replace items atomically; admin "last-admin" guard uses `SELECT … FOR UPDATE` inside a tx so two
  concurrent demotions serialize).

---

## 5. How it fits together (request lifecycle)

**Read (e.g. opening the KDS):**
`Browser → Next.js Route Handler GET /api/kitchen (server) → Prisma client (src/lib/db.ts) →
@prisma/adapter-pg → pg driver → Neon Postgres → rows → typed objects → JSON → React renders tickets`

**Write (e.g. taking payment):**
`Client checkout → fetch POST /api/orders/[id]/payment → Route Handler validates + CAS guard
(updateMany where status=DRAFT) → Prisma $transaction → Postgres → 200 + receipt data`

**Auth:** Auth.js (NextAuth v5) with **JWT sessions** (not DB sessions — required once we added a
Credentials/email-password provider). Role rides the JWT; `requireRole`/`requireEmployee` read it.
Passwords are bcrypt-hashed in `User.passwordHash`. Google OAuth is a secondary login.

---

## 6. Rapid-fire cheat sheet

- **Framework?** Next.js 16, App Router, React 19, TypeScript.
- **Why full-stack Next?** One repo/language, Server Components fetch data server-side, Route
  Handlers are the API. Less glue than SPA+API.
- **ORM?** Prisma 7 — engine-less, driver adapter `@prisma/adapter-pg` over `pg`. Type-safe queries,
  schema-as-source-of-truth, committed migrations.
- **DB?** PostgreSQL on Neon (hosted, pooled connection). Relational, FKs, transactions.
- **Money?** `Decimal(10,2)`, never float.
- **Concurrency?** Read Committed + compare-and-swap writes + partial-unique indexes + CHECK
  constraints. No double payments, one draft per table.
- **Security/authz?** App-enforced `requireRole` (ADMIN/EMPLOYEE) + server-side route guards
  (`admin/layout.tsx`). JWT auth. No RLS (single tenant, single DB role).
- **Migrations on shared DB?** `prisma migrate deploy` (never `migrate dev` — it can reset). Owner-only.
- **Biggest data-model call?** `OrderItem` snapshots name+price (immutable history); two statuses on
  `Order` (`status` = payment, `kitchenStatus` = cooking) decouple cashier and kitchen flows.
