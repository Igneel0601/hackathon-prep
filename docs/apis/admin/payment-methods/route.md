# `GET /api/admin/payment-methods`

> Mirrors `src/app/api/admin/payment-methods/route.ts`. Admin-only.

**Purpose:** List the three payment-method settings (CASH/CARD/UPI).

**Auth:** `requireRole("ADMIN")`.

## Response
- **200:** `{ "settings": [ { "method": "CASH", "enabled": true, "upiId": null, "label": null }, … ] }` (always all three; missing rows default to enabled).
