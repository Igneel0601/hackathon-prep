# `POST /api/self-checkout`

> Mirrors `src/app/api/self-checkout/route.ts`. Update this file in the same change as the route.

**Purpose:** Public kiosk order. A guest (no login) picks a free table + items and gives an
email for the receipt. Creates a DRAFT order, fires all items to the kitchen immediately
(round 1, `TO_COOK`), and emails a receipt with the total due. **No payment here** — the
cashier collects payment at the table as normal (`POST /api/orders/[id]/payment`).

**Auth:** none. Orders attach to a seeded kiosk system user's PosSession (see `src/lib/kiosk.ts`
and `docs/seed/README.md`).

## Request

- **Body** (JSON):
  ```json
  {
    "email": "guest@example.com",
    "tableId": "string",
    "items": [
      { "productId": "string", "qty": 2 }
    ]
  }
  ```
  - `email` — required; must look like a valid email address.
  - `tableId` — required; must reference an existing, **active**, currently **free** Table
    (no open DRAFT order). Occupied tables are rejected.
  - `items` — required non-empty array; each item needs `productId` (string) and `qty`
    (positive integer). Products must exist and be active.

## Response

- **201**:
  ```json
  { "orderNumber": 12, "tableNumber": 3, "subtotal": "440", "tax": "22", "total": "462" }
  ```
- **400** — Validation error (bad email, missing/invalid fields, unknown table/product, inactive
  table/product).
- **409** — Table is occupied (already has a DRAFT order) — race lost or stale table list.

## Example

```bash
curl -X POST http://localhost:3000/api/self-checkout \
  -H 'Content-Type: application/json' \
  -d '{ "email": "guest@example.com", "tableId": "<id>", "items": [{ "productId": "<id>", "qty": 2 }] }'
```

## Notes / errors

- Money math mirrors `POST /api/orders` (server-computed `Prisma.Decimal`, no discount).
- Customer is looked up/created by email (`Customer.name` is set to the email — no name
  collected from the kiosk).
- Items are created at `round: 1, kitchenStatus: "TO_COOK"` — they appear on the Kitchen
  Display immediately, same as a cashier hitting "Send to Kitchen".
- Receipt email is **best-effort**: if SMTP fails, the order is still placed (error logged
  server-side). See `src/lib/mailer.ts` — without `SMTP_HOST` configured, emails are logged
  instead of sent.
