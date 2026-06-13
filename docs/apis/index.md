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

> Rows above are pre-registered for the parallel API build. Each route's `route.md` is authored on its own branch alongside the handler.
