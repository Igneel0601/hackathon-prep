# `PATCH /api/orders/[id]`

> Mirrors `src/app/api/orders/[id]/route.ts`. Update this file in the same change as the route.

**Purpose:** Update a DRAFT order — replace its line items, change the discount, or assign/remove a customer. Totals are always recomputed server-side.

**Auth:** Requires a valid session (any authenticated employee/admin). Returns `401` if signed out. **Floor-shared:** any employee can edit any table's order — edits are not scoped to the cashier's session.

---

## PATCH — Edit a Draft Order

### Request

- **Path params:** `id` (string) — the order's cuid.
- **Body** (JSON, all fields optional):
  ```json
  {
    "items": [
      { "productId": "string", "qty": 2 }
    ],
    "discount": 10,
    "customerId": "string | null"
  }
  ```
  - `items` — if provided, **replaces all existing line items** on the order. Must be a non-empty array; each entry needs `productId` (string) and `qty` (positive integer).
  - `discount` — if provided, replaces the current discount amount (non-negative number, absolute value not percent).
  - `customerId` — if provided, sets the customer (`null` to clear). Must reference an existing Customer when a string.

### DRAFT-only rule + concurrency guards

Only orders with `status === "DRAFT"` can be edited. Attempting to PATCH a `PAID` or `CANCELLED` order returns **409**.

Two further guards close edit races:
- **Items already sent to the kitchen can't be changed.** If `kitchenStatus !== "NONE"` (the order is cooking) and the body includes `items`, returns **409** (`"Items already sent to kitchen and can't be changed"`). `discount`/`customerId` may still be edited.
- **Compare-and-swap on write.** The DRAFT check is re-asserted *inside* the transaction via `updateMany({ where: { id, status: "DRAFT" } })`. If a payment lands between the read and the write, the guard matches 0 rows and returns **409** (`"Order is no longer editable"`) instead of silently editing a now-PAID order or losing a concurrent edit.

### Money recomputation

Whenever `items` is supplied, totals are fully recomputed:

1. `unitPrice` + `name` re-snapshotted from the product at edit time.
2. `lineTotal = unitPrice × qty`
3. `subtotal = Σ lineTotal`
4. `tax = Σ (lineTotal × product.tax / 100)`
5. `total = subtotal + tax − discount`

When only `discount` or `customerId` changes (no `items`), `subtotal` and `tax` are carried forward from the existing order and only `total` changes (`total = subtotal + tax − newDiscount`).

All arithmetic uses `Prisma.Decimal`. Float math is never used.

The item replacement and order update run inside a single DB transaction to avoid partial-write states.

### Response

- **200** — Updated order (same shape as `POST /api/orders` 201):
  ```json
  {
    "id": "...", "number": 12, "status": "DRAFT", "kitchenStatus": "NONE",
    "subtotal": "440", "tax": "22", "discount": "10", "total": "452",
    "tableId": "...", "customerId": null, "sessionId": "...",
    "items": [
      { "id": "...", "productId": "...", "name": "Espresso", "unitPrice": "120", "qty": 2, "lineTotal": "240" }
    ],
    "customer": null,
    "createdAt": "2026-06-13T10:00:00.000Z"
  }
  ```
  Money fields are **strings**.
- **400** — Validation error (invalid fields, unknown product/customer, inactive product, or `discount` greater than `subtotal + tax`).
- **401** — Not authenticated.
- **404** — Order not found.
- **409** — Order is not in DRAFT status, items already sent to kitchen, or it became un-editable concurrently.
- **500** — Unexpected server error.

### Example

```bash
# Replace items + change discount
curl -X PATCH http://localhost:3000/api/orders/ord_abc123 \
  -H 'Content-Type: application/json' \
  -d '{
    "items": [{ "productId": "prod_xyz", "qty": 3 }],
    "discount": 10
  }'

# Only update discount (items unchanged)
curl -X PATCH http://localhost:3000/api/orders/ord_abc123 \
  -H 'Content-Type: application/json' \
  -d '{ "discount": 20 }'
```

---

## Notes / errors

- Supplying `items: []` returns `400` — an order must always have at least one line.
- If a product referenced in `items` is inactive, returns `400`.
- Paid/cancelled orders are immutable via this endpoint; use the payment/kitchen routes for state transitions.
