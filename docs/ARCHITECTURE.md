# Architecture

Running doc. Keep the overview current; append to the Decision Log — never rewrite history.

## Overview

Hackathon project on **Next.js 16 (App Router)** + **React 19** + **TypeScript** + **Tailwind CSS**, package-managed with **pnpm**, deployed to **Vercel**.

### Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Next.js 16 (App Router) | Server Components by default |
| UI | React 19 + Tailwind | client components only when needed |
| Language | TypeScript (strict) | |
| Package manager | pnpm | lockfile `pnpm-lock.yaml` |
| Hosting | Vercel | `main` = demo source of truth |
| Data | _TBD_ | fill when picked |

### Structure

- `src/app/` — routes (`page.tsx`), layouts, and API route handlers (`src/app/api/.../route.ts`).
- `docs/apis/` — one doc per route, mirroring the route path.
- `docs/seed/` — seed/fixture state Claude tests against.
- Data flows: Server Component / Server Action fetches data → renders. Client components are leaf-level and interactive-only.

## Decision Log

Format: **date — decision — why — alternatives rejected.**

- **2026-06-12 — pnpm over npm/yarn.** Fast, disk-efficient, strict node_modules. Rejected: npm (slower, flat deps).
- **2026-06-12 — Next.js 16 App Router.** Server Components + Vercel-native deploy + Server Actions reduce API surface. Rejected: Pages Router (legacy), separate SPA+API (more glue).
- **2026-06-12 — Docs live with code.** API doc per route under `docs/apis/`, single ARCHITECTURE.md, seed state in `docs/seed/`. Enforced by a blocking `pre-push` hook (route changed without doc → push rejected). Why: Claude writes/runs tests against documented contracts; drift = false test failures. Rejected: no docs (Claude reverse-engineers contracts), pre-commit hook (nags every commit).
