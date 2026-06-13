# `POST /api/admin/tables`

> Mirrors `src/app/api/admin/tables/route.ts`. Admin-only.

**Purpose:** Add a table to a floor.

**Auth:** `requireRole("ADMIN")`.

## Request
- **Body:** `{ "floorId": "…", "number": 5, "seats"?: 4, "active"?: true }`.

## Response
- **201:** `{ id, number, seats, active, orderCount: 0 }`.
- **409:** a table with that number already exists on the floor (`@@unique[floorId,number]`).
- **400:** missing/invalid `floorId` or `number`.
