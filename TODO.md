# TODO

## Tonight (optional)
- [ ] Google OAuth creds → `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` in `.env` (only blocker for working login; skip if idea may not need login)
- [ ] Copilot ruleset — currently **disabled** (no review running). Decide: re-enable **Active** with Copilot-only rule (no PR requirement), or leave off until PRs start
- [ ] `DIRECT_URL` lock (optional) — to truly enforce only-Vaibhav-migrates, share only `DATABASE_URL` in chat and pull `DIRECT_URL`

## Tomorrow (once problem statement drops)
- [ ] Name feature verticals in `docs/TEAM.md` (Rajat = A, Mukund = B)
- [ ] Vinayak: shadcn/ui init
- [ ] First real models → Vaibhav runs `pnpm db:migrate`

## Nice-to-have
- [ ] Bump CI actions off Node 20 (cosmetic deprecation warning)

---

## Done ✅
- Next.js 16 + React 19 + TS + Tailwind, pnpm, on `main`
- Prisma 7 + Neon — migrated + seeded, connection verified
- Pooled/direct URL split (`DATABASE_URL` / `DIRECT_URL`)
- Auth.js v5 wired (Google provider, DB sessions); `AUTH_SECRET` set
- Pre-push hook (typecheck + API-doc-sync); CI (lint/typecheck/build) green
- Docs: AGENTS.md, ARCHITECTURE, TEAM.md, API template+index, seed, Copilot instructions
- Onboarding README; DB-safety guard in AGENTS.md
- Secrets shared with team
