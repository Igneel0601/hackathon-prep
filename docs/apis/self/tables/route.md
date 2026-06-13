# `GET /api/self/tables`

> Mirrors `src/app/api/self/tables/route.ts`. Update this file in the same change as the route.

**Purpose:** Public floors + tables (with free/occupied flag) for the self-checkout kiosk.

**Auth:** none — public kiosk endpoint (read-only).

## Request
- No params or body.

## Response
- **200** — `{ "floors": Floor[] }` where each table has `{ id, number, seats, active, hasActiveOrder }` (same shape as `/api/tables`).
- **5xx** — `{ "error": "string" }`

## Example
```bash
curl http://localhost:3000/api/self/tables
```

## Notes / errors
- `hasActiveOrder = true` when the table has a DRAFT order — the kiosk UI blocks those (free tables only).
