# `POST /api/signup`

> Mirrors `src/app/api/signup/route.ts`. Update this file in the same change as the route.

**Purpose:** Create a new email/password account (spec §2.1 Signup). After signup, the user logs in via the Credentials provider (`/api/auth/...`).

**Auth:** public. New accounts get the `EMPLOYEE` role by default (an admin can promote later).

## Request

- **Body** (JSON):
  ```json
  { "name": "Cashier Two", "email": "cashier2@cafe.com", "password": "secret123" }
  ```
  - `name` — required, non-empty.
  - `email` — required, must contain `@`; stored lowercased; must be unique.
  - `password` — required, **min 8 chars**; stored as a bcrypt hash, never in plaintext.

## Response

- **201** — `{ "id": "...", "name": "Cashier Two", "email": "cashier2@cafe.com", "role": "EMPLOYEE" }`
- **400** — `{ "error": "..." }` (missing/invalid field, or malformed JSON)
- **409** — `{ "error": "An account with this email already exists" }`

## Example

```bash
curl -X POST http://localhost:3000/api/signup \
  -H 'Content-Type: application/json' \
  -d '{ "name": "Cashier Two", "email": "cashier2@cafe.com", "password": "secret123" }'
```

## Notes

- Login is handled by Auth.js (Credentials provider) — this route only creates the account.
- Seeded accounts already exist (see `docs/seed/README.md`): `admin@test.com` / `cashier@test.com`.
