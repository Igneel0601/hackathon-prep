// Next.js 16 Proxy (formerly Middleware — renamed in v16, same behavior).
// UX gate: bounce signed-out users to /login. Lightweight cookie presence check
// (not cryptographic) — the REAL enforcement is server-side in every API route
// via requireUser() in src/lib/api.ts. Keeping the heavy auth config (Prisma
// adapter, bcrypt) out of the proxy avoids edge-bundling issues.
import { NextResponse, type NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const hasSession =
    req.cookies.has("authjs.session-token") ||
    req.cookies.has("__Secure-authjs.session-token");

  if (!hasSession) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

// Run on everything except API routes, Next internals, the login page, and assets.
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|welcome|self).*)"],
};
