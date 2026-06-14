# `GET /api/kitchen`

> Mirrors `src/app/api/kitchen/route.ts`. Update this file in the same change as the route.

**Purpose:** Kitchen Display System (KDS) ticket feed. Returns active kitchen orders (TO_COOK or PREPARING) with only items that have `sendToKitchen: true`, oldest first.

**Auth:** Requires a valid session (any authenticated employee). Returns 401 if signed out.

## Request

- **Query:** `?status=TO_COOK|PREPARING|COMPLETED` (optional) — filter by a specific kitchen stage. Omit to get the active queue (TO_COOK + PREPARING).

## Response

- **200** — ticket list:
  ```json
  { "tickets": [
    { "orderId": "string", "number": 12, "kitchenStatus": "TO_COOK",
      "items": [{ "productId": "string", "name": "Veg Sandwich", "qty": 1 }],
      "createdAt": "2026-06-13T10:00:00.000Z" }
  ] }
  ```
- **400** — `{ "error": "status must be TO_COOK, PREPARING, or COMPLETED" }`
- **401** — `{ "error": "Not authenticated" }`
- **500** — `{ "error": "Internal server error" }`

## Example

```bash
# All active kitchen orders
curl http://localhost:3000/api/kitchen

# Only orders currently being prepared
curl "http://localhost:3000/api/kitchen?status=PREPARING"

# Completed orders (for review)
curl "http://localhost:3000/api/kitchen?status=COMPLETED"
```

## Notes / errors

- Items in each ticket are filtered to only those where `Product.sendToKitchen === true`. Drinks/cold items not flagged for kitchen are excluded.
- Default (no `?status`) returns TO_COOK + PREPARING — the live queue the KDS displays.
- Orders are sorted oldest-first so the kitchen works in arrival order.
- The NONE status cannot be queried (those orders haven't entered the kitchen flow yet).
- Only `DRAFT` (unpaid) orders are returned — as soon as an order is checked out (`POST /api/orders/[id]/payment` marks it `PAID`), it drops off the board immediately, even if some items are still TO_COOK/PREPARING.
