# TODO

## Now — team building the MVP (Cafe POS)
Branch off `dev`, PR back into `dev`. Spine in `docs/SCOPE.md`; endpoints in `docs/apis/`.
- [ ] **Vinayak** — `feat/ui-shell`: shadcn init, app shell + top nav, components from the mockup
- [ ] **Rajat** — `feat/order-view`: floor → Order View → cart → cash pay (`/api/tables`, `/api/products`, `/api/orders`, `…/payment`)
- [ ] **Mukund** — `feat/kitchen-display`: Send-to-Kitchen → KDS (poll 2-3s) → Orders list (`…/kitchen`, `/api/kitchen`, `/api/orders`)
- [ ] **Vaibhav** — integration, PR review, wire login UI to `signIn()`; add-on APIs when spine is green

## Optional / later
- [ ] Real Google OAuth creds (secondary login) — email/password already works without them
- [ ] `DIRECT_URL` lock — share only `DATABASE_URL` in chat to enforce only-Vaibhav-migrates
- [ ] Bump CI actions off Node 20 (cosmetic deprecation warning)
- [ ] Add-ons (only after MVP demos clean) — see `docs/SCOPE.md`: coupons, UPI/Card, dashboard, customer mgmt

---

## Done ✅
- Next.js 16 + React 19 + TS + Tailwind, pnpm; `feat → dev → main` flow, rulesets + CI (lint/typecheck/build + doc-sync)
- Prisma 7 + Neon — schema, migrations, seed live (6 products / 3 categories / 1 floor + 4 tables)
- **Problem locked: Odoo Cafe POS** — brief + mockup in `docs/{brief,design}`; MVP cut + plan-aware split in `docs/{SCOPE,TEAM}`
- **POS API layer** — 7 routes (products, tables, orders CRUD, payment, kitchen, KDS) + docs, Copilot-reviewed
- **Auth** — email/password (primary) + Google (secondary), JWT sessions; `POST /api/signup`
  - Seed logins: `cashier@test.com` / `cashier123` · `admin@test.com` / `admin123`
- Docs: AGENTS, ARCHITECTURE (decision log + data model), TEAM, SCOPE, DEMO, seed, API index
- Secrets (`DATABASE_URL` / `AUTH_SECRET`) shared with team
