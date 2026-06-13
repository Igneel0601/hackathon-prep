# `GET /api/self-checkout/tables`

> Mirrors `src/app/api/self-checkout/tables/route.ts`. Update this file in the same change as the route.

**Purpose:** Active tables with a free/occupied flag, for the public self-checkout kiosk's
table picker. Same shape as `GET /api/tables` but with no auth, and only `active: true` tables
are included (kiosk can't seat a guest at an inactive table).

**Auth:** none.

## Request

None.

## Response

- **200**:
  ```json
  {
    "floors": [
      {
        "id": "...", "name": "Ground Floor",
        "tables": [
          { "id": "...", "number": 1, "seats": 4, "active": true, "hasActiveOrder": false }
        ]
      }
    ]
  }
  ```
  - `hasActiveOrder: true` means the table has an open DRAFT order — occupied, not selectable
    in the kiosk.

## Example

```bash
curl http://localhost:3000/api/self-checkout/tables
```

## Notes / errors

- The kiosk UI filters to `hasActiveOrder === false` and lets the guest pick from those.
- `POST /api/self-checkout` re-checks occupancy server-side (race-safe) before creating the order.
- Public + unauthenticated → rate-limited to **60 requests / minute per IP** (`src/lib/rate-limit.ts`); over that returns **429**.
