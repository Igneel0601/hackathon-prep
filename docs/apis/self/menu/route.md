# `GET /api/self/menu`

> Mirrors `src/app/api/self/menu/route.ts`. Update this file in the same change as the route.

**Purpose:** Public menu (active products + all categories) for the self-checkout kiosk.

**Auth:** none — this is a public kiosk endpoint (read-only).

## Request
- No params or body.

## Response
- **200** — `{ "categories": Category[], "products": Product[] }` (same shape as `/api/products`).
- **5xx** — `{ "error": "string" }`

## Example
```bash
curl http://localhost:3000/api/self/menu
```

## Notes / errors
- Returns only `active` products. No auth on purpose (kiosk runs unauthenticated).
