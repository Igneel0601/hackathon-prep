# `POST /api/orders/[id]/payment`

> Mirrors `src/app/api/orders/[id]/payment/route.ts`. Update this file in the same change as the route.

**Purpose:** Take payment for a Draft order. Creates a Payment record and marks the order as PAID in a single transaction.

**Auth:** Requires a valid session (any authenticated employee). Returns 401 if signed out. The order is looked up **scoped to the cashier's open POS session** — an order belonging to a different session is treated as not found (`404`), so one shift can't pay another shift's order.

> **Enabled-method guard:** the chosen `method` must be enabled in the admin Payment-Method settings; a disabled method returns **409** (`<METHOD> payments are currently disabled`), even if a stale client offered it.

## Request

- **Path params:** `id` (string) — the order CUID.
- **Body** (JSON):
  ```json
  {
    "method": "CASH" | "CARD" | "UPI",
    "amountReceived": 250.00,
    "reference": "optional-card-or-upi-ref"
  }
  ```
  - `method` — required. Payment method.
  - `amountReceived` — required for CASH (must be ≥ order total). Ignored for CARD/UPI.
  - `reference` — optional string. Card transaction ref or UPI note (simulated in MVP).

## Response

- **200** — payment result:
  ```json
  {
    "order": {
      "id": "string", "number": 12, "status": "PAID", "kitchenStatus": "TO_COOK",
      "subtotal": "200.00", "tax": "36.00", "discount": "0.00", "total": "236.00"
    },
    "payment": {
      "id": "string", "method": "CASH", "amount": "236.00",
      "reference": null, "changeDue": "14.00", "createdAt": "..."
    },
    "changeDue": "14.00"
  }
  ```
  All money values are serialised as **strings** (Prisma Decimal). `changeDue` is `null` for CARD/UPI.
- **400** — validation errors:
  - `'method must be "CASH", "CARD", or "UPI"'`
  - `"amountReceived is required for CASH payments"`
  - `"amountReceived is less than order total"`
- **401** — `{ "error": "Not authenticated" }`
- **404** — `{ "error": "Order not found" }` — unknown order, or it belongs to a different POS session.
- **409** — `{ "error": "Order is not payable" }` — order is not in DRAFT status (already PAID or CANCELLED).
- **500** — `{ "error": "Internal server error" }`

## Example

```bash
# Cash payment with change
curl -X POST http://localhost:3000/api/orders/clxyz123/payment \
  -H 'Content-Type: application/json' \
  -d '{ "method": "CASH", "amountReceived": 300 }'

# Card payment
curl -X POST http://localhost:3000/api/orders/clxyz123/payment \
  -H 'Content-Type: application/json' \
  -d '{ "method": "CARD", "reference": "TXN-001" }'
```

## Notes / errors

- Change is computed with `Decimal` arithmetic (no floats): `changeDue = amountReceived - order.total`.
- The order status update and Payment row creation happen in a single Prisma `$transaction` — no partial writes.
- CARD and UPI are simulated in the MVP: the endpoint accepts a `reference` string but does not call any payment gateway.
- An order can only be paid once — attempting to pay a PAID or CANCELLED order returns 409.
