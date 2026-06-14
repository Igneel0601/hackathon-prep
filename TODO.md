# TODO

## MVP — DONE ✅ (demoable end-to-end)
Login → pick table → build order → Send to Kitchen → **KDS** → pay → receipt.
- [x] Auth (email/password + Google), login screen, route guard
- [x] Order View — products, cart, qty, discount, totals
- [x] Send to Kitchen + Kitchen Display (`/kds`, live polling, stage advance)
- [x] Payment — Cash (change) + Card/UPI (simulated) → receipt (print)
- [x] Session orders list (`/orders`) + home nav
- [x] Per-table order persistence — resume draft, no duplicates, tables free on pay

## Now — make it demo-grade
- [ ] **Vinayak** — visual reskin to the mockup (current UI is functional, not designed)
- [ ] **Mukund** — QA pass per `docs/mukund.md`; file + verify bugs
- [ ] Fill `docs/DEMO.md` talking points + rehearse the click-path
- [ ] Promote `dev → main` at the demo checkpoint

## Add-ons (only if MVP polish is solid) — see `docs/SCOPE.md`
- [ ] Cancel order (→ CANCELLED) to vacate an abandoned table without paying
- [ ] Admin CRUD (products / categories / tables / payment methods) — currently seeded
- [ ] Coupons & automated promotions
- [ ] Reporting dashboard
- [ ] UPI QR (real QR from saved UPI ID), order detail view, customer management

## Optional / housekeeping
- [ ] Real Google OAuth creds (secondary login; email/password works without)
- [ ] `DIRECT_URL` lock to enforce only-Vaibhav-migrates
- [ ] Bump CI actions off Node 20 (cosmetic warning)

---

## Foundation (done earlier)
- Next.js 16 + React 19 + TS + Tailwind + shadcn; pnpm
- Prisma 7 + Neon — schema, migrations, seed; `feat → dev → main` flow, rulesets + CI
- Full POS API layer + typed client (`src/lib/api-*`); docs per route (doc-sync CI)
- Vitest + Testing Library (`pnpm test`) — hook/component tests
