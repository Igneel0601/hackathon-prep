# `METHOD /api/<path>`

> Mirrors `src/app/api/<path>/route.ts`. Update this file in the same change as the route.

**Purpose:** one line — what this endpoint does.

**Auth:** none / session / token — and what happens if missing.

## Request

- **Path params:** `id` (string) — …
- **Query:** `?limit=` (number, optional) — …
- **Body** (JSON):
  ```json
  { "field": "string" }
  ```

## Response

- **200** — `{ "id": "string", "field": "string" }`
- **4xx/5xx** — `{ "error": "string" }`

## Example

```bash
curl -X METHOD http://localhost:3000/api/<path> \
  -H 'Content-Type: application/json' \
  -d '{ "field": "value" }'
```

## Notes / errors

- Edge cases, known failure modes, seed data this relies on.
