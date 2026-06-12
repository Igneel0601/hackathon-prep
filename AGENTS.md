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
- **Seed data** — fixtures Claude tests against. Seed *script* lives near code (`scripts/seed.ts`); the known state (test users, IDs) is documented in `docs/seed/README.md`. Update the doc whenever the script changes.
- These exist because Claude writes and runs tests against documented contracts — stale docs = false test failures.

## Hackathon workflow

- Branch per feature: `feat/<thing>`. Open PRs into `main`. Don't push broken builds to `main`.
- Commit often, small messages. Speed over polish, but `pnpm build` must pass before merge.
- Deploy target: TBD. `main` = source of truth for the demo.
- If you add an env var, tell the team — it must be set wherever we deploy too, or the deploy breaks.
