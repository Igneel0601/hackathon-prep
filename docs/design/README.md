# Design / Mockups

Wireframes and mockups for the build. Caption each image so judges/teammates can read it without opening files.

## Source mockup (Odoo Cafe POS)

- **In-repo:** [`cafe-pos-mockup.svg`](./cafe-pos-mockup.svg) — full mockup, all screens stacked (open in a browser; ~15.8k px tall, scalable). This is the source of truth for the build — prefer it over the link.
- **Excalidraw (live):** https://link.excalidraw.com/l/65VNwvy7c4X/1Vvr9oy6B3F
  (official mockup from the problem brief — `docs/brief/odoo-cafe-pos.pdf`, page 9)

The SVG covers (top → bottom): backend admin (products, categories, payment methods, floor/tables, coupons, users), POS terminal (floor pop-up, Order View, payment, orders, customer), Kitchen Display, and the reporting dashboard.

## Pages to design (Vinayak) — MVP priority order

Design these 6 first — they ARE the demo:

1. **Login / Signup** — email + password, Google button, signup toggle
2. **Order View** ← **the hero** (most screen time): product grid + cart + payment trigger. Most polish here.
3. **Floor / Table picker** — modal, grid of table cards, available vs active states
4. **Payment modal + Receipt** — Cash (amount → change), UPI (QR), Card (ref) → receipt
5. **Kitchen Display (KDS)** — ticket cards moving To Cook → Preparing → Completed
6. **Orders list** — session orders (number, customer, amount, status)

Add-ons (design only after the 6 above): admin shell, product/category CRUD, dashboard, coupons.

## Design ↔ wiring contract (component props)

Design and data-wiring run in parallel. The seam is the **component inventory + props** — design to these, and Rajat/Mukund wire dummy versions of the same components so swap-in is a reskin. **Money props are `string`** (Decimal-as-string from the API). Full table in [`../TEAM.md`](../TEAM.md#design-runs-in-parallel--wire-against-dummy-ui): `TableCard`, `FloorPickerModal`, `CategoryTabs`, `ProductCard`, `CartLine`, `OrderSummary`, `PaymentModal`, `TicketCard`.
