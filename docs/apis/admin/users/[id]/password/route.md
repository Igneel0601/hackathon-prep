# `POST /api/admin/users/[id]/password`

> Mirrors `src/app/api/admin/users/[id]/password/route.ts`. Admin-only.

**Purpose:** Set a user's password (admin reset).

**Auth:** `requireRole("ADMIN")`.

## Request / Response
- **Body:** `{ "password": "…" }` (min 8). Stored bcrypt-hashed.
- **200:** `{ "ok": true }`.
