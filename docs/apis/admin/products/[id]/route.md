# `PATCH /api/admin/products/[id]` · `DELETE /api/admin/products/[id]`

> Mirrors `src/app/api/admin/products/[id]/route.ts`. Admin-only.

**Purpose:** Update a product, or delete/archive it.

**Auth:** `requireRole("ADMIN")`.

## PATCH — update (partial)
- **Body:** any of `{ name, price, unit, tax, description (nullable), sendToKitchen, active, categoryId }`.
- **200:** updated `Product`. **400:** invalid field / unknown `categoryId`. **404:** not found.

## DELETE — archive-or-delete
- If the product is referenced by any order (`OrderItem`): **200** `{ "archived": true, "product": Product }` (soft-delete `active=false`, preserves order history).
- Otherwise: **204** (hard-deleted).

## Example
```bash
curl -X PATCH http://localhost:3000/api/admin/products/<id> \
  -H 'Content-Type: application/json' -b "$ADMIN_COOKIE" \
  -d '{ "price": 185, "active": false }'
```
