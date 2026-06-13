# API Index

Every route handler under `src/app/api/` has a mirrored doc here:
`src/app/api/<path>/route.ts` → `docs/apis/<path>/route.md`.

Add a row when you add a route. Copy `_template.md` for the doc body.

| Method | Path | Doc | Purpose |
|--------|------|-----|---------|
| GET/POST | `/api/auth/*` | [auth/route.md](./auth/route.md) | Auth.js — email/password + Google login, session endpoints |
| POST | `/api/signup` | [signup/route.md](./signup/route.md) | Create an email/password account |
| GET | `/api/products` | [products/route.md](./products/route.md) | List active products (optional `?categoryId=`); categories |
| GET | `/api/tables` | [tables/route.md](./tables/route.md) | Floors + their tables (with active-order flag) |
| GET/POST | `/api/orders` | [orders/route.md](./orders/route.md) | List session orders / create a Draft order |
| PATCH | `/api/orders/[id]` | [orders/[id]/route.md](./orders/[id]/route.md) | Update a Draft order (items, qty, discount) |
| POST | `/api/orders/[id]/payment` | [orders/[id]/payment/route.md](./orders/[id]/payment/route.md) | Take payment (Cash) → mark Paid |
| POST | `/api/orders/[id]/kitchen` | [orders/[id]/kitchen/route.md](./orders/[id]/kitchen/route.md) | Send to kitchen / advance kitchenStatus |
| GET | `/api/kitchen` | [kitchen/route.md](./kitchen/route.md) | KDS tickets (orders in the kitchen queue) |
| GET/POST | `/api/admin/categories` | [admin/categories/route.md](./admin/categories/route.md) | Admin: list / create categories |
| PATCH/DELETE | `/api/admin/categories/[id]` | [admin/categories/[id]/route.md](./admin/categories/[id]/route.md) | Admin: update / delete a category |
| GET/POST | `/api/admin/products` | [admin/products/route.md](./admin/products/route.md) | Admin: list / create products (on-the-fly category) |
| PATCH/DELETE | `/api/admin/products/[id]` | [admin/products/[id]/route.md](./admin/products/[id]/route.md) | Admin: update / archive-or-delete a product |
| GET | `/api/admin/payment-methods` | [admin/payment-methods/route.md](./admin/payment-methods/route.md) | Admin: list payment-method settings |
| PATCH | `/api/admin/payment-methods/[method]` | [admin/payment-methods/[method]/route.md](./admin/payment-methods/[method]/route.md) | Admin: toggle/configure a payment method |
| GET | `/api/payment-methods` | [payment-methods/route.md](./payment-methods/route.md) | POS: enabled methods for checkout |
| GET/POST | `/api/admin/floors` | [admin/floors/route.md](./admin/floors/route.md) | Admin: list / create floors |
| PATCH/DELETE | `/api/admin/floors/[id]` | [admin/floors/[id]/route.md](./admin/floors/[id]/route.md) | Admin: rename / delete a floor |
| POST | `/api/admin/tables` | [admin/tables/route.md](./admin/tables/route.md) | Admin: create a table |
| PATCH/DELETE | `/api/admin/tables/[id]` | [admin/tables/[id]/route.md](./admin/tables/[id]/route.md) | Admin: update / archive-or-delete a table |
| GET/POST | `/api/admin/users` | [admin/users/route.md](./admin/users/route.md) | Admin: list / create users |
| PATCH/DELETE | `/api/admin/users/[id]` | [admin/users/[id]/route.md](./admin/users/[id]/route.md) | Admin: update / archive-or-delete a user |
| POST | `/api/admin/users/[id]/password` | [admin/users/[id]/password/route.md](./admin/users/[id]/password/route.md) | Admin: set a user's password |
| PATCH | `/api/admin/users/[id]/archive` | [admin/users/[id]/archive/route.md](./admin/users/[id]/archive/route.md) | Admin: archive/restore a user |
| GET | `/api/self-checkout/menu` | [self-checkout/menu/route.md](./self-checkout/menu/route.md) | Public kiosk: active menu (products + categories) |
| GET | `/api/self-checkout/tables` | [self-checkout/tables/route.md](./self-checkout/tables/route.md) | Public kiosk: active tables with free/occupied flag |
| POST | `/api/self-checkout` | [self-checkout/route.md](./self-checkout/route.md) | Public kiosk: place a Draft order (no payment), email receipt |

> Rows above are pre-registered for the parallel API build. Each route's `route.md` is authored on its own branch alongside the handler.
