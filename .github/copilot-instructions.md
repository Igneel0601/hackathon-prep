# Copilot instructions

Hackathon project: Next.js 16 (App Router) + React 19 + TypeScript (strict) + Tailwind, pnpm, Prisma 7 (Postgres/Neon), Auth.js v5. Code in `src/`. See `AGENTS.md` and `docs/` for full conventions.

## Code review focus

Review in this priority order. Be concise — one line per finding: location, problem, fix. Don't restate the diff or praise; only flag what needs changing.

1. **Correctness bugs** (highest priority) — logic errors, unhandled errors/nulls, race conditions, broken async/await, incorrect types, security issues (injection, secrets in code, missing auth checks).
2. **Reuse & simplification** — duplicated logic, reinventing existing helpers (e.g. use the shared `db` client from `src/lib/db.ts`, never `new PrismaClient()`), over-complex code that could be simpler.
3. **Efficiency** — needless re-renders, N+1 queries, work that belongs in a Server Component done on the client.

Only raise issues you're confident about. Skip nits and style the linter already covers.

## Project rules to enforce in review

- **Server Components by default.** `'use client'` only for state/effects/browser APIs; keep client components small and leaf-level.
- **Data flow:** fetch in Server Components; mutations via Server Actions or route handlers — not client fetches to our own API.
- **Prisma:** import `db` from `src/lib/db.ts`. **Never edit `prisma/schema.prisma` outside the owner's branch** (see `docs/TEAM.md`). Flag schema edits on feature branches.
- **Docs-with-code:** a new/changed `src/app/api/<path>/route.ts` must update its mirrored `docs/apis/<path>/route.md` in the same PR. Flag a route change with no matching doc.
- **Secrets:** never hardcode keys; they belong in `.env` (gitignored). Flag any secret in committed code.
- **TypeScript strict:** flag `any` without a clear reason.
- **Tailwind** for styling; no stray CSS files unless unavoidable.
