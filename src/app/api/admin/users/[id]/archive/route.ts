// Admin: archive/unarchive a user (toggle active).
// See docs/apis/admin/users/[id]/archive/route.md.
import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ApiError, errorResponse, json, requireRole } from "@/lib/api";
import { bool } from "@/lib/validate";
import { assertNotSelf } from "@/lib/admin-guards";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const me = await requireRole("ADMIN");
    const { id } = await params;
    let body: { active?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      throw new ApiError(400, "Invalid JSON body");
    }
    const active = bool(body.active, "active");

    const user = await db.$transaction(async (tx) => {
      if (!active) {
        // Deactivating: protect self + last admin. Lock the active-admin rows so
        // concurrent deactivations can't both strand the cafe with zero admins.
        assertNotSelf(id, me.id);
        const target = await tx.user.findUnique({ where: { id }, select: { role: true } });
        if (target?.role === "ADMIN") {
          await tx.$queryRaw`SELECT id FROM "User" WHERE "role" = 'ADMIN' AND "active" = true FOR UPDATE`;
          const others = await tx.user.count({
            where: { role: "ADMIN", active: true, NOT: { id } },
          });
          if (others === 0) throw new ApiError(409, "Can't remove the last active admin");
        }
      }
      return tx.user.update({
        where: { id },
        data: { active },
        select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
      });
    });
    return json({ ...user, createdAt: user.createdAt.toISOString() });
  } catch (e) {
    return errorResponse(e);
  }
}
