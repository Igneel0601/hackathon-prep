# Architecture

Running doc. Keep the overview current; append to the Decision Log — never rewrite history.

## Overview

Hackathon project on **Next.js 16 (App Router)** + **React 19** + **TypeScript** + **Tailwind CSS**, package-managed with **pnpm**. Deploy target TBD.

### Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Next.js 16 (App Router) | Server Components by default |
| UI | React 19 + Tailwind | client components only when needed |
| Language | TypeScript (strict) | |
| Package manager | pnpm | lockfile `pnpm-lock.yaml` |
| Hosting | _TBD_ | `main` = demo source of truth |
| Database | PostgreSQL (Neon, likely) | hosted; connection via `DATABASE_URL` |
| ORM | Prisma 7 | engine-less, `@prisma/adapter-pg` driver adapter |

### Structure

- `src/app/` — routes (`page.tsx`), layouts, and API route handlers (`src/app/api/.../route.ts`).
- `docs/apis/` — one doc per route, mirroring the route path.
- `docs/seed/` — seed/fixture state Claude tests against.
- Data flows: Server Component / Server Action fetches data → renders. Client components are leaf-level and interactive-only.

## Decision Log

Format: **date — decision — why — alternatives rejected.**

- **2026-06-12 — pnpm over npm/yarn.** Fast, disk-efficient, strict node_modules. Rejected: npm (slower, flat deps).
- **2026-06-12 — Next.js 16 App Router.** Server Components + Server Actions reduce API surface; full-stack in one repo. Rejected: Pages Router (legacy), separate SPA+API (more glue).
- **2026-06-12 — PostgreSQL + Prisma 7.** Postgres on Neon (hosted, free tier, no local docker). Prisma for type-safe queries + built-in migrations/seed; Claude knows it well, `schema.prisma` self-documents. Prisma 7 is engine-less → requires a driver adapter (`@prisma/adapter-pg` over `pg`). Shared client singleton in `src/lib/db.ts` to survive Next hot-reload. Migrations in `prisma/migrations/` (committed), seed in `prisma/seed.ts`. Rejected: Drizzle (lighter but Claude less reliable), raw SQL (no type safety). **Caveat:** serverless + Prisma needs connection pooling — use Neon's pooled URL (`-pooler` host); revisit Accelerate/PgBouncer if we hit connection limits.
- **2026-06-12 — Docs live with code.** API doc per route under `docs/apis/`, single ARCHITECTURE.md, seed state in `docs/seed/`. Enforced by a blocking `pre-push` hook (route changed without doc → push rejected). Why: Claude writes/runs tests against documented contracts; drift = false test failures. Rejected: no docs (Claude reverse-engineers contracts), pre-commit hook (nags every commit).
