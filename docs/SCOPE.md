# Scope

**Process:** one person (Vaibhav / whoever's leading) drafts the MVP cut **fast** — then the team
confirms in ~5 min and locks it. One drafter avoids design-by-committee paralysis; the quick
confirm gets buy-in and maps roles to features. Do this in the **first 30 min** after the problem drops.

Judges reward a **working core**, not a pile of half-built features. Build the MVP end to end FIRST.

**Problem:** Odoo Cafe POS — web-based restaurant point-of-sale. Spec: [`docs/brief/odoo-cafe-pos.pdf`](./brief/odoo-cafe-pos.pdf). Mockup: [`docs/design/cafe-pos-mockup.svg`](./design/cafe-pos-mockup.svg).

## The core flow (MVP) — build this FIRST

The single user journey that proves the product works. Nothing else matters until this runs
start→finish without breaking. This doubles as the demo click-path.

1. [ ] **Log in** → POS session opens directly *(Auth.js already wired)*
2. [ ] **Pick a table** from the floor pop-up → Order View opens
3. [ ] **Build the order** — add products to cart (category tabs / search), adjust quantity, see subtotal/tax/total
4. [ ] **Send to Kitchen** → order appears on the Kitchen Display (separate tab) in ~real time; move ticket To Cook → Preparing → Completed ← **the "wow"**
5. [ ] **Take payment (Cash)** → order marked Paid → receipt shown

✅ **MVP DONE** = a judge can do steps 1→5 live without it breaking.

> Minimum seed to demo: a few products in 2-3 categories, one floor with a couple of tables,
> Cash payment enabled. Admin CRUD can be seeded/manual at first — the *terminal flow* is what's judged.

## Add-ons (ONLY after MVP works)

The parking lot. Every "ooh we could also…" idea goes here, ranked. Pull from the top
**only** once the core flow above is solid.

1. [ ] **Backend admin CRUD UI** — products, categories (with color), floors/tables, payment methods (beyond seed data)
2. [ ] **Coupons & promotions** — manual coupon code + auto product/order promotions
3. [ ] **More payment methods** — UPI QR (generate from saved UPI ID) + Card (txn reference)
4. [ ] **Item-level KDS progress** — strikethrough individual items within a ticket
5. [ ] **Customer management** — attach customer to order, use email for receipt
6. [ ] **Reporting dashboard** — revenue/orders/AOV, sales-trend + top products/categories charts, filters
7. [ ] **Receipt delivery** — print + email receipt
8. [ ] **Session close summary** + reports export (PDF/XLS)
9. [ ] **Orders list / edit draft** — reopen a Draft order back into the cart

## Explicitly NOT doing

Saying "no" out loud kills 2am rabbit holes. List what we're consciously skipping.

- **WebSockets/SSE for "real time"** — Kitchen Display uses simple polling (2-3s). Good enough for a local demo.
- **Real payment gateways** — Card/UPI are simulated (reference / "Confirmed" button), no actual money movement.
- **Multi-tenant / multiple cafes** — single cafe, single shared DB.
- **Pixel-perfect parity with Odoo** — match the flow and the mockup, not every Odoo detail.
- **Tax engine** — flat per-product tax field, no tax groups/inclusive-exclusive rules.
- **Offline mode / PWA** — online only.
