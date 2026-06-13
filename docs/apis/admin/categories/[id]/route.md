# `PATCH /api/admin/categories/[id]` · `DELETE /api/admin/categories/[id]`

> Mirrors `src/app/api/admin/categories/[id]/route.ts`. Admin-only.

**Purpose:** Rename/recolor or delete a category.

**Auth:** `requireRole("ADMIN")`.

## PATCH — update
- **Body (partial):** `{ "name"?: string, "color"?: string }`.
- **200:** updated category `{ id, name, color, productCount }`.
- **404:** category not found. **409:** new name collides.

## DELETE — restrict
- **204:** deleted.
- **409:** category still has products — reassign/remove them first (no cascade, to avoid orphaning the menu).

## Example
```bash
curl -X PATCH http://localhost:3000/api/admin/categories/<id> \
  -H 'Content-Type: application/json' -b "$ADMIN_COOKIE" \
  -d '{ "color": "#16a34a" }'
```
