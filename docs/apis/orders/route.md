# `GET /api/orders` · `POST /api/orders`

> Mirrors `src/app/api/orders/route.ts`. Update this file in the same change as the route.

**Purpose:** List all orders for the current open POS session (GET) or create a new DRAFT order (POST).

**Auth:** Requires a valid session (any authenticated employee/admin). Returns `401` if signed out. Opens a POS session implicitly on first call.

---

## POST — Create a Draft Order

### Request

- **Body** (JSON):
  ```json
  {
    "tableId": "string",
    "items": [
      { "productId": "string", "qty": 2 }
    ],
    "customerId": "string | null (optional)",
    "discount": 0
  }
  ```
  - `tableId` — required; must reference an existing Table.
  - `items` — required non-empty array; each item needs `productId` (string) and `qty` (positive integer).
  - `customerId` — optional; must reference an existing Customer if provided.
  - `discount` — optional non-negative number (absolute amount, not percent); defaults to `0`.

### Money computation

Server is the source of truth — the client never sends prices.

1. For each line item: `unitPrice` + `name` are **snapshotted** from the product at creation time so later product edits do not rewrite order history.
2. `lineTotal = unitPrice × qty`
3. `subtotal = Σ lineTotal`
4. `tax = Σ (lineTotal × product.tax / 100)` — per-product tax rate, summed across lines
5. `total = subtotal + tax − discount`

All arithmetic uses `Prisma.Decimal` (backed by `decimal.js`). Float math is never used.

### Response

- **201** — Created order:
  ```json
  {
    "id": "...", "number": 12, "status": "DRAFT", "kitchenStatus": "NONE",
    "subtotal": "440", "tax": "22", "discount": "0", "total": "462",
    "tableId": "...", "customerId": null, "sessionId": "...",
    "items": [
      { "id": "...", "productId": "...", "name": "Espresso", "unitPrice": "120", "qty": 2, "lineTotal": "240" }
    ],
    "customer": null,
    "createdAt": "2026-06-13T10:00:00.000Z"
  }
  ```
  Money fields (`subtotal`, `tax`, `discount`, `total`, `unitPrice`, `lineTotal`) are **strings**.
- **400** — Validation error (missing/invalid fields, unknown table/product, inactive product).
- **401** — Not authenticated.
- **500** — Unexpected server error.

### Example

```bash
curl -X POST http://localhost:3000/api/orders \
  -H 'Content-Type: application/json' \
  -d '{
    "tableId": "tbl_abc123",
    "items": [{ "productId": "prod_xyz", "qty": 2 }],
    "discount": 0
  }'
```

---

## GET — List Session Orders

### Request

- **Query:**
  - `?status=DRAFT|PAID|CANCELLED` (optional) — filter by order status.

### Response

- **200** — Array of order objects (newest first), same shape as POST 201 above. Each order includes its `items` and `customer` (id + name) if set.
- **400** — Invalid `status` value.
- **401** — Not authenticated.

### Example

```bash
# All orders in current session
curl http://localhost:3000/api/orders

# Only DRAFT orders
curl 'http://localhost:3000/api/orders?status=DRAFT'
```

---

## Notes / errors

- A POS session is opened implicitly if none is open — cashiers don't need a separate "open session" step.
- Products must be `active: true` — attempting to order a deactivated product returns `400`.
- Seed data: see `docs/seed/README.md` for known table/product IDs usable in tests.
