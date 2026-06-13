# `GET /api/payment-methods`

> Mirrors `src/app/api/payment-methods/route.ts`. POS-facing.

**Purpose:** The payment methods the cashier may offer at checkout — **only enabled ones**.

**Auth:** `requireUser()` (any signed-in employee/admin).

## Response
- **200:** `{ "methods": [ { "method": "CASH", "upiId": null }, { "method": "UPI", "upiId": "cafe@okhdfc" } ] }` — `upiId` is non-null only for UPI (the POS builds the QR from it).

## Notes
- Fresh DB with no settings rows → defaults to all three enabled.
- The payment route (`/api/orders/[id]/payment`) independently rejects a disabled method with 409.
