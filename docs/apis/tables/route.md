# `GET /api/tables`

> Mirrors `src/app/api/tables/route.ts`. Update this file in the same change as the route.

**Purpose:** Returns all floors with their tables, including a `hasActiveOrder` flag that indicates whether any DRAFT order is currently open on that table.

**Auth:** Session required — throws 401 if not authenticated.

## Request

- **Path params:** none
- **Query:** none
- **Body:** none

## Response

- **200** —
  ```json
  {
    "floors": [
      {
        "id": "cuid",
        "name": "Ground Floor",
        "tables": [
          {
            "id": "cuid",
            "number": 1,
            "seats": 4,
            "active": true,
            "hasActiveOrder": false
          }
        ]
      }
    ]
  }
  ```
  Tables within each floor are ordered by `number` (ascending). Floors are ordered by `name` (ascending).
  `hasActiveOrder` is `true` if the table has one or more orders with `status: "DRAFT"`.
- **401** — `{ "error": "Not authenticated" }` — user has no active session.
- **500** — `{ "error": "Internal server error" }` — unexpected failure.

## Example

```bash
curl http://localhost:3000/api/tables \
  -H 'Cookie: next-auth.session-token=<your-session>'
```

## Notes / errors

- Inactive tables (`active: false`) are still included in the response so the UI can display them as unavailable/disabled. The POS terminal decides rendering.
- `hasActiveOrder` uses a filtered `_count` in a single Prisma query (no N+1). DRAFT orders are the "in-progress" orders that occupy a table.
- Seed data: see `docs/seed/README.md` for known floor/table IDs to test against.
