# `GET /api/products`

> Mirrors `src/app/api/products/route.ts`. Update this file in the same change as the route.

**Purpose:** Returns all active products (optionally filtered by category) and all categories, for use by the POS terminal tabs and product grid.

**Auth:** Session required — throws 401 if not authenticated.

## Request

- **Path params:** none
- **Query:** `?categoryId=<id>` (string, optional) — filter products to this category only. Omit to return all active products.
- **Body:** none

## Response

- **200** —
  ```json
  {
    "categories": [
      { "id": "cuid", "name": "Coffee", "color": "#6f4e37" }
    ],
    "products": [
      {
        "id": "cuid",
        "name": "Espresso",
        "price": "120.00",
        "unit": "piece",
        "tax": "5.00",
        "description": null,
        "sendToKitchen": false,
        "categoryId": "cuid"
      }
    ]
  }
  ```
  `categories` is always the full list (all categories, regardless of `?categoryId`). `products` is filtered to `active: true` and optionally to `categoryId`.
  Note: `price` and `tax` are Prisma `Decimal` fields — they serialize as strings. The client should parse them with `parseFloat()` or `Number()`.
- **401** — `{ "error": "Not authenticated" }` — user has no active session.
- **500** — `{ "error": "Internal server error" }` — unexpected failure.

## Example

```bash
# All products
curl http://localhost:3000/api/products \
  -H 'Cookie: authjs.session-token=<your-session>'

# Products in a specific category
curl "http://localhost:3000/api/products?categoryId=clxyz123" \
  -H 'Cookie: authjs.session-token=<your-session>'
```

## Notes / errors

- `categories` is always returned in full so the POS can render all tabs even when a category filter is active.
- Products are ordered alphabetically by `name`; categories also by `name`.
- An invalid `categoryId` returns an empty `products` array (no 404).
- Seed data: see `docs/seed/README.md` for known category/product IDs to test against.
