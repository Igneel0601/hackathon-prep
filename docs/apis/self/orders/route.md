# `POST /api/self/orders`

> Mirrors `src/app/api/self/orders/route.ts`. Update this file in the same change as the route.

**Purpose:** Place a self-checkout (kiosk) order on a FREE table and fire it straight to the kitchen. Payment is taken later at the counter by staff.

**Auth:** none — public kiosk endpoint. Orders are backed server-side by a lazily-created **kiosk service account** + its PosSession (`src/lib/kiosk.ts`), so no logged-in cashier is required.

## Request
- **Body** (JSON):
  ```json
  {
    "tableId": "string",
    "items": [{ "productId": "string", "qty": 1 }],
    "customer": { "email": "you@example.com", "name": "optional" }
  }
  ```

## Response
- **201** — `{ "id": "string", "number": 123 }`
- **400** — invalid body / unknown product / invalid email.
- **409** — the table already has an open (DRAFT) order — pick another or ask staff.
- **5xx** — `{ "error": "string" }`

## Example
```bash
curl -X POST http://localhost:3000/api/self/orders \
  -H 'Content-Type: application/json' \
  -d '{ "tableId": "ckxxx", "items": [{ "productId": "ckyyy", "qty": 2 }], "customer": { "email": "a@b.com" } }'
```

## Notes / errors
- Customer is found-or-created by email (`Customer.email` is not unique).
- Items are created at `round: 1` with `kitchenStatus: TO_COOK`, and the order's `kitchenStatus` is set to `TO_COOK` — i.e. fired to the kitchen immediately. Order stays `DRAFT` (unpaid) until staff settle it via the normal payment flow.
- Free-table-only: a DRAFT pre-check plus the DB partial-unique guard both reject occupied tables.
