# `PATCH /api/admin/payment-methods/[method]`

> Mirrors `src/app/api/admin/payment-methods/[method]/route.ts`. Admin-only.

**Purpose:** Enable/disable a method or set its UPI id / label. `method` ∈ CASH|CARD|UPI.

**Auth:** `requireRole("ADMIN")`.

## Request
- **Body (partial):** `{ "enabled"?: boolean, "upiId"?: string|null, "label"?: string|null }`.

## Response
- **200:** `{ method, enabled, upiId, label }`.
- **400:** enabling UPI without a `upiId`.
- **409:** disabling the **last** enabled method.

## Example
```bash
curl -X PATCH http://localhost:3000/api/admin/payment-methods/UPI \
  -H 'Content-Type: application/json' -b "$ADMIN_COOKIE" \
  -d '{ "enabled": true, "upiId": "cafe@okhdfc" }'
```
