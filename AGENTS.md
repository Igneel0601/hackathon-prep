<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project

Hackathon project. Next.js 16 (App Router) + React 19 + TypeScript + Tailwind. Code lives in `src/`.

## Commands

- `pnpm dev` — dev server (http://localhost:3000)
- `pnpm build` — production build; run before deploy
- `pnpm lint` — ESLint; run before committing
- `pnpm start` — serve the production build

Use pnpm, not npm/yarn. Lockfile is `pnpm-lock.yaml`.

## Structure

- `src/app/` — App Router. Routes are folders; `page.tsx` = route, `layout.tsx` = shared shell.
- Server Components by default. Add `'use client'` ONLY when you need state, effects, or browser APIs.
- Keep client components small and leaf-level; fetch data in Server Components.
- `public/` — static assets served from `/`.

## Conventions

- TypeScript strict — no `any` without a reason.
- Tailwind for styling — no separate CSS files unless unavoidable.
- Data mutations go through Server Actions or route handlers, not client fetches to ourselves.
- Keep secrets in `.env.local` (gitignored). Never commit keys.

## Documentation rules (enforced)

Docs live with code. A blocking `pre-push` hook rejects pushes that change an API route without updating its doc.

- **API routes** — every `src/app/api/<path>/route.ts` has a mirrored doc at `docs/apis/<path>/route.md`. Create/update it in the SAME change as the route, copy `docs/apis/_template.md`, and add a row to `docs/apis/index.md`.
- **Architecture** — `docs/ARCHITECTURE.md` is the running system doc. Made a notable choice (library, data store, pattern)? Append it to the Decision Log (date — decision — why — alternatives rejected). Don't rewrite history.
- **Seed data** — fixtures Claude tests against. Seed *script* is `prisma/seed.ts` (run `pnpm db:seed`); the known state (test users, IDs) is documented in `docs/seed/README.md`. Update the doc whenever the script changes.
- **Demo / jury notes** — when you ship a notable user-facing feature, add to `docs/DEMO.md`: what it does in plain English, where it sits in the demo click-path, and any "wow" moment. This is how we'll brief the jury — keep it current as you build, don't leave it to the last hour.
- **Data model** — when models change, update the Data Model section in `docs/ARCHITECTURE.md` (entities, relationships, why). Mentors quiz the DB design in judging.
- These exist because Claude writes and runs tests against documented contracts — stale docs = false test failures.

## MVP-first (judging discipline)

- **Build the MVP before any add-on.** `docs/SCOPE.md` defines the core flow vs add-ons. Do NOT build anything from "Add-ons" while the MVP checkboxes are unticked — if asked to, push back and point at SCOPE.md. Judges reward a working core, not half-built features.
- **You own what you ship.** Whoever's name is on a feature must be able to explain it cold — what/how/why — to a mentor. Review agent output before committing; don't merge code you can't defend. Log who built what in `docs/TEAM.md`.

## Hackathon workflow

- **Ownership:** see `docs/TEAM.md` for who owns what. Notably `prisma/schema.prisma` has a single owner (Vaibhav) — don't edit the schema on someone else's branch; request the model change instead. Shared UI lives in `src/components/`.
- **DB safety — do NOT run `pnpm db:migrate`, `prisma migrate`, or `pnpm db:reset`** unless you are the schema owner (Vaibhav). These hit the **shared Neon DB** and can wipe everyone's data. Need a schema change? Ask the owner. `pnpm db:seed` (idempotent) is fine.
- Branch per feature: `feat/<thing>`. Open PRs into `main`. Don't push broken builds to `main`.
- Commit often, small messages. Speed over polish, but `pnpm build` must pass before merge.
- Deploy target: TBD. `main` = source of truth for the demo.
- If you add an env var, tell the team — it must be set wherever we deploy too, or the deploy breaks.

## After pushing — CI

The pre-push hook already runs typecheck locally, so CI is a backup. Don't poll CI on every push.

- **Watch CI** (`gh run watch <id> --exit-status`) ONLY when the push touched: dependencies, `next.config.*`, `prisma/` (schema/migrations), `.github/workflows/`, or anything where `build` can fail but `typecheck` passed (RSC / server-client boundary). Fix red CI before moving on.
- **Otherwise** (routine feature/UI commits): trust the local typecheck and move on. Check CI only if a later step fails.
