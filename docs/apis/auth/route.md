# `GET|POST /api/auth/*`

> Mirrors `src/app/api/auth/[...nextauth]/route.ts`. Managed by Auth.js (NextAuth v5) — do not hand-roll these.

**Purpose:** Auth.js catch-all. Handles login (email/password + Google) and session endpoints.

**Auth:** public (these endpoints *establish* auth). New accounts are created via `POST /api/signup`.

**Providers:** Credentials (email/password, primary) + Google (secondary, optional). **Sessions are JWT** (Credentials can't use database sessions). Sign in to the Credentials provider by POSTing `email` + `password` to the Auth.js callback (`/api/auth/callback/credentials`) with the CSRF token, or via the `signIn("credentials", …)` helper from a client/server action.

## Endpoints (provided by Auth.js)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/auth/signin` | Sign-in page / provider list |
| GET | `/api/auth/callback/google` | OAuth callback |
| POST | `/api/auth/signout` | Sign out |
| GET | `/api/auth/session` | Current session JSON (`{}` if signed out) |
| GET | `/api/auth/providers` | Configured providers |
| GET | `/api/auth/csrf` | CSRF token |

## Config

- Defined in `src/auth.ts`. Adapter: Prisma (`@auth/prisma-adapter`); session strategy: **JWT**.
- Providers: **Credentials** (email/password, checks bcrypt against `User.passwordHash`) + **Google** (optional, reads `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`).
- Requires `AUTH_SECRET` (see `.env.example`). Google creds are optional — email/password works without them.

## Usage in code

```ts
import { auth } from "@/auth";           // server: const session = await auth();
import { signIn, signOut } from "@/auth"; // server actions
```

## Notes

- DB sessions require the `Account` / `Session` / `User` / `VerificationToken` tables (in `prisma/schema.prisma`). Run `pnpm db:migrate` before testing.
- To add a provider, edit `src/auth.ts` and add its env vars to `.env.example`.
