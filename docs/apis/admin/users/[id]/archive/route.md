# `PATCH /api/admin/users/[id]/archive`

> Mirrors `src/app/api/admin/users/[id]/archive/route.ts`. Admin-only.

**Purpose:** Archive (deactivate) or restore a user. Archived users can't log in.

**Auth:** `requireRole("ADMIN")`.

## Request / Response
- **Body:** `{ "active": false }` to archive, `{ "active": true }` to restore.
- **200:** the updated user `{ id, name, email, role, active, createdAt }`.
- **409:** archiving yourself or the last active admin.
