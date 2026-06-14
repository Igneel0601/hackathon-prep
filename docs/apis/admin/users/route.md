# `GET /api/admin/users` · `POST /api/admin/users`

> Mirrors `src/app/api/admin/users/route.ts`. Admin-only.

**Purpose:** List staff accounts (paginated) / create one.

**Auth:** `requireRole("ADMIN")`.

## GET
- **Query:** `?q=` (name/email search), `?role=ADMIN|EMPLOYEE`, `?page=`, `?pageSize=` (max 100).
- **200:** `{ "data": [ { id, name, email, role, active, createdAt } ], total, page, pageSize }`.

## POST
- **Body:** `{ name, email, role: "ADMIN"|"EMPLOYEE", password (min 8) }` → bcrypt-hashed.
- **201:** the created user. **409:** email already exists.
