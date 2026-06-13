# `GET /api/admin/products` · `POST /api/admin/products`

> Mirrors `src/app/api/admin/products/route.ts`. Admin-only.

**Purpose:** List products (incl. inactive, paginated/filterable) / create a product (with optional on-the-fly category).

**Auth:** `requireRole("ADMIN")`.

## GET — list
- **Query:** `?q=` (name search), `?categoryId=`, `?active=true|false`, `?page=` (default 1), `?pageSize=` (default 50, max 100).
- **200:** `{ "data": [ Product ], "total": number, "page": number, "pageSize": number }`.
- `Product` = `{ id, name, price, unit, tax, description, sendToKitchen, active, categoryId, category: { id, name, color } }`. **Money (`price`, `tax`) are decimal strings.**

## POST — create
- **Body:** `{ name, price, unit?, tax?, description?, sendToKitchen?, categoryId? | newCategory?: { name, color } }`.
  - Provide **exactly one** of `categoryId` or `newCategory` (on-the-fly category creation — both created in one transaction).
- **201:** the created `Product`. **400:** validation / missing category. **409:** duplicate (via on-the-fly category name).

## Example
```bash
curl -X POST http://localhost:3000/api/admin/products \
  -H 'Content-Type: application/json' -b "$ADMIN_COOKIE" \
  -d '{ "name": "Latte", "price": 170, "tax": 5, "categoryId": "<cat>" , "sendToKitchen": false }'
```
