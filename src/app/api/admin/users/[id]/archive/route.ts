// Admin: archive/unarchive a user (toggle active).
// See docs/apis/admin/users/[id]/archive/route.md.
import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ApiError, errorResponse, json, requireRole } from "@/lib/api";
import { bool } from "@/lib/validate";
import { assertNotSelf, assertNotLastAdmin } from "@/lib/admin-guards";

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

    if (!active) {
      // Deactivating: protect self + last admin.
      assertNotSelf(id, me.id);
      const target = await db.user.findUnique({ where: { id }, select: { role: true } });
      if (target?.role === "ADMIN") await assertNotLastAdmin(id);
    }

    const user = await db.user.update({
      where: { id },
      data: { active },
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    });
    return json({ ...user, createdAt: user.createdAt.toISOString() });
  } catch (e) {
    return errorResponse(e);
  }
}
