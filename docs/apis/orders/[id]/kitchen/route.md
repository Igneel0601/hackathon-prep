# `POST /api/orders/[id]/kitchen`

> Mirrors `src/app/api/orders/[id]/kitchen/route.ts`. Update this file in the same change as the route.

**Purpose:** Send an order to the kitchen or advance its cooking stage (TO_COOK → PREPARING → COMPLETED).

**Auth:** Requires a valid session (any authenticated employee). Returns 401 if signed out.

## Request

- **Path params:** `id` (string) — the order CUID.
- **Body** (JSON):
  ```json
  { "action": "send" | "advance" }
  ```
  - `"send"` — sends the order to kitchen (only valid when `kitchenStatus === "NONE"`).
  - `"advance"` — moves the order one step forward: `TO_COOK → PREPARING → COMPLETED`.

## Response

- **200** — updated order summary:
  ```json
  { "id": "string", "number": 12, "status": "DRAFT", "kitchenStatus": "TO_COOK" }
  ```
- **400** — `{ "error": "action must be \"send\" or \"advance\"" }`
- **401** — `{ "error": "Not authenticated" }`
- **404** — `{ "error": "Order not found" }`
- **409** — conflict:
  - `"Order already sent to kitchen"` — `send` when `kitchenStatus !== "NONE"`
  - `"Send to kitchen first"` — `advance` when `kitchenStatus === "NONE"`
  - `"Already completed"` — `advance` when `kitchenStatus === "COMPLETED"`
- **500** — `{ "error": "Internal server error" }`

## Example

```bash
# Send to kitchen
curl -X POST http://localhost:3000/api/orders/clxyz123/kitchen \
  -H 'Content-Type: application/json' \
  -d '{ "action": "send" }'

# Advance stage (TO_COOK → PREPARING)
curl -X POST http://localhost:3000/api/orders/clxyz123/kitchen \
  -H 'Content-Type: application/json' \
  -d '{ "action": "advance" }'
```

## Notes / errors

- `kitchenStatus` and `status` (payment) are independent fields — you can send to kitchen before or after payment.
- Kitchen status progression is one-way: NONE → TO_COOK → PREPARING → COMPLETED. No rollback.
- `advance` from TO_COOK and PREPARING both move forward one step; PREPARING → COMPLETED is the final state.
