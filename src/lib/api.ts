// Shared helpers for POS API route handlers. Import from "@/lib/api".
// Keeps auth, error handling, and JSON responses consistent across every route.
//
// Pattern for a handler:
//   export async function POST(req: Request) {
//     try {
//       const user = await requireEmployee();
//       const body = await req.json();
//       ...
//       return json(result, 201);
//     } catch (e) {
//       return errorResponse(e);
//     }
//   }
//
// Note: Prisma `Decimal` fields serialize to JSON as strings — the client parses
// them with Number()/parseFloat. Don't do money math in floats on the server.
import { auth } from "@/auth";
import { db } from "@/lib/db";

export type Role = "ADMIN" | "EMPLOYEE";

/** Throw inside a handler; `errorResponse` turns it into the right HTTP status. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Success JSON response. */
export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

/** Maps a thrown error to a JSON error response. Use in every handler's catch. */
export function errorResponse(e: unknown): Response {
  if (e instanceof ApiError) {
    return Response.json({ error: e.message }, { status: e.status });
  }
  console.error("[api] unhandled error:", e);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}

/** Current authenticated user (id + role). Throws 401 if signed out. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new ApiError(401, "Not authenticated");
  }
  return session.user;
}

/** Require a specific role. Throws 401 if signed out, 403 if wrong role. */
export async function requireRole(role: Role) {
  const user = await requireUser();
  if (user.role !== role) {
    throw new ApiError(403, "Forbidden");
  }
  return user;
}

/** Cashier-only routes (POS terminal). ADMIN is also allowed (can do anything). */
export async function requireEmployee() {
  return requireUser(); // any authenticated user operates the terminal; tighten if needed
}

/**
 * The cashier's currently-open POS session, creating one if none is open.
 * Orders attach to this. Opens implicitly on first terminal action (spec 2.8).
 */
export async function getOpenPosSession(userId: string) {
  const existing = await db.posSession.findFirst({
    where: { userId, closedAt: null },
    orderBy: { openedAt: "desc" },
  });
  if (existing) return existing;
  return db.posSession.create({ data: { userId } });
}
