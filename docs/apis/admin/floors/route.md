# `GET /api/admin/floors` · `POST /api/admin/floors`

> Mirrors `src/app/api/admin/floors/route.ts`. Admin-only.

**Purpose:** List floors (with their tables) / create a floor.

**Auth:** `requireRole("ADMIN")`.

## GET
- **200:** `{ "floors": [ { "id", "name", "tables": [ { "id", "number", "seats", "active", "orderCount" } ] } ] }` (includes inactive tables).

## POST
- **Body:** `{ "name": "Rooftop" }`.
- **201:** the created floor (empty `tables`).
