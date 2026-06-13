# `PATCH /api/admin/users/[id]` · `DELETE /api/admin/users/[id]`

> Mirrors `src/app/api/admin/users/[id]/route.ts`. Admin-only.

**Auth:** `requireRole("ADMIN")`.

## PATCH — update name/role
- **Body (partial):** `{ "name"?, "role"? }`.
- **409:** demoting the **last active admin** to EMPLOYEE (or demoting yourself).

## DELETE — archive-or-delete
- **409:** deleting yourself or the last active admin.
- If the user has POS sessions (history) → **200** `{ "archived": true, "user": { id, active:false } }`.
- Otherwise → **204**.
