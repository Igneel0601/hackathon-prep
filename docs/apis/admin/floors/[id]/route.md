# `PATCH /api/admin/floors/[id]` · `DELETE /api/admin/floors/[id]`

> Mirrors `src/app/api/admin/floors/[id]/route.ts`. Admin-only.

**Auth:** `requireRole("ADMIN")`.

## PATCH — rename
- **Body:** `{ "name": "…" }` → **200** `{ id, name }`.

## DELETE — restrict
- **204:** deleted.
- **409:** floor still has tables (remove them first).
