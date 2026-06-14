# `PATCH /api/admin/tables/[id]` · `DELETE /api/admin/tables/[id]`

> Mirrors `src/app/api/admin/tables/[id]/route.ts`. Admin-only.

**Auth:** `requireRole("ADMIN")`.

## PATCH — update
- **Body (partial):** `{ "number"?, "seats"?, "active"? }` → **200** `{ id, number, seats, active }`.

## DELETE — archive-or-delete
- If the table has order history → **200** `{ "archived": true, "table": { id, active:false } }`.
- Otherwise → **204** (hard-deleted).
