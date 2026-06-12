# API Index

Every route handler under `src/app/api/` has a mirrored doc here:
`src/app/api/<path>/route.ts` → `docs/apis/<path>/route.md`.

Add a row when you add a route. Copy `_template.md` for the doc body.

| Method | Path | Doc | Purpose |
|--------|------|-----|---------|
| GET/POST | `/api/auth/*` | [auth/route.md](./auth/route.md) | Auth.js — OAuth flow + session endpoints |
