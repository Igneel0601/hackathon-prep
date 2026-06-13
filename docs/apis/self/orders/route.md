# `POST /api/self/orders`

> Mirrors `src/app/api/self/orders/route.ts`. Update this file in the same change as the route.

**Purpose:** Place a self-checkout (kiosk) order on a FREE table and fire it straight to the kitchen. Payment is taken later at the counter by staff.

**Auth:** none — public kiosk endpoint. Orders are backed server-side by a lazily-created **kiosk service account** + its PosSession (`src/lib/kiosk.ts`), so no logged-in cashier is required.

**Limits (public-abuse guards):** rate-limited to **10 orders/min per IP**; max **50 items** per order; per-item `qty` **1–99**.

## Request
- **Body** (JSON):
  ```json
  {
    "tableId": "string",
    "items": [{ "productId": "string", "qty": 1 }]
  }
  ```

## Response
- **201** — `{ "id": "string", "number": 123 }`
- **400** — invalid body / unknown product / too many items / `qty` out of range (1–99).
- **409** — the table already has an open (DRAFT) order — pick another or ask staff.
- **429** — too many orders from this device (rate limit) — wait and retry.
- **5xx** — `{ "error": "string" }`

## Example
```bash
curl -X POST http://localhost:3000/api/self/orders \
  -H 'Content-Type: application/json' \
  -d '{ "tableId": "ckxxx", "items": [{ "productId": "ckyyy", "qty": 2 }] }'
```

## Notes / errors
- Items are created at `round: 1` with `kitchenStatus: TO_COOK`, and the order's `kitchenStatus` is set to `TO_COOK` — i.e. fired to the kitchen immediately. Order stays `DRAFT` (unpaid) until staff settle it via the normal payment flow.
- Free-table-only: a DRAFT pre-check plus the DB partial-unique guard both reject occupied tables.
- No customer info is collected here. A receipt can be emailed later from the counter via the optional `email` field on `POST /api/orders/[id]/payment`.
