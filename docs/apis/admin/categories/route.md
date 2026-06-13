# `GET /api/admin/categories` · `POST /api/admin/categories`

> Mirrors `src/app/api/admin/categories/route.ts`. Admin-only.

**Purpose:** List all categories (with product counts) / create a category.

**Auth:** `requireRole("ADMIN")` → 403 for non-admins, 401 if signed out.

## GET — list
- **Response 200:** `{ "categories": [ { "id": "...", "name": "Coffee", "color": "#6f4e37", "productCount": 3 } ] }`

## POST — create
- **Body:** `{ "name": "Pastries", "color": "#d97706" }` — `name` required (unique), `color` optional (defaults `#6b7280`).
- **201:** the created category (same shape, `productCount: 0`).
- **409:** name already exists. **400:** missing/invalid name.

## Example
```bash
curl -X POST http://localhost:3000/api/admin/categories \
  -H 'Content-Type: application/json' -b "$ADMIN_COOKIE" \
  -d '{ "name": "Pastries", "color": "#d97706" }'
```

## Notes
- Category color propagates to the POS (tabs, product cards) automatically — POS reads `category.color`.
