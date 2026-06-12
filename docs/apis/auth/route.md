# `GET|POST /api/auth/*`

> Mirrors `src/app/api/auth/[...nextauth]/route.ts`. Managed by Auth.js (NextAuth v5) — do not hand-roll these.

**Purpose:** Auth.js catch-all. Handles the full OAuth flow and session endpoints.

**Auth:** public (these endpoints *establish* auth).

## Endpoints (provided by Auth.js)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/auth/signin` | Sign-in page / provider list |
| GET | `/api/auth/callback/:provider` | OAuth callback |
| POST | `/api/auth/signout` | Sign out |
| GET | `/api/auth/session` | Current session JSON (`{}` if signed out) |
| GET | `/api/auth/providers` | Configured providers |
| GET | `/api/auth/csrf` | CSRF token |

## Config

- Defined in `src/auth.ts`. Adapter: Prisma (`@auth/prisma-adapter`) → **database sessions**.
- Provider: **GitHub** (placeholder). Reads `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`.
- Requires `AUTH_SECRET` (see `.env.example`).

## Usage in code

```ts
import { auth } from "@/auth";           // server: const session = await auth();
import { signIn, signOut } from "@/auth"; // server actions
```

## Notes

- DB sessions require the `Account` / `Session` / `User` / `VerificationToken` tables (in `prisma/schema.prisma`). Run `pnpm db:migrate` before testing.
- To add a provider, edit `src/auth.ts` and add its env vars to `.env.example`.
