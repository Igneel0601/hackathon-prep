# `GET /api/self-checkout/menu`

> Mirrors `src/app/api/self-checkout/menu/route.ts`. Update this file in the same change as the route.

**Purpose:** Active products + categories for the public self-checkout kiosk. Same shape as
`GET /api/products` but with no auth and no `?categoryId=` filter (kiosk filters client-side).

**Auth:** none.

## Request

None.

## Response

- **200**:
  ```json
  {
    "categories": [{ "id": "...", "name": "Coffee", "color": "#6f4e37" }],
    "products": [
      { "id": "...", "name": "Espresso", "price": "120", "unit": "piece", "tax": "5.00", "description": null, "sendToKitchen": false, "categoryId": "..." }
    ]
  }
  ```
  Money fields are strings.

## Example

```bash
curl http://localhost:3000/api/self-checkout/menu
```

## Notes / errors

- Only `active: true` products are returned.
- Public + unauthenticated → rate-limited to **60 requests / minute per IP** (`src/lib/rate-limit.ts`); over that returns **429**.
