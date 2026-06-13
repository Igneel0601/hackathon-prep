// Admin: update / delete a user. See docs/apis/admin/users/[id]/route.md.
import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ApiError, errorResponse, json, requireRole } from "@/lib/api";
import { str, oneOf, optional } from "@/lib/validate";
import { assertNotSelf, assertNotLastAdmin } from "@/lib/admin-guards";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const me = await requireRole("ADMIN");
    const { id } = await params;
    let body: { name?: unknown; role?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      throw new ApiError(400, "Invalid JSON body");
    }

    const name = optional(body.name, (v) => str(v, "name", { max: 80 }));
    const role = optional(body.role, (v) => oneOf(v, "role", ["ADMIN", "EMPLOYEE"] as const));

    // Demoting the last admin to employee would lock everyone out of admin.
    if (role === "EMPLOYEE") {
      const target = await db.user.findUnique({ where: { id }, select: { role: true } });
      if (target?.role === "ADMIN") {
        assertNotSelf(id, me.id);
        await assertNotLastAdmin(id);
      }
    }

    const user = await db.user.update({
      where: { id },
      data: { ...(name !== undefined ? { name } : {}), ...(role !== undefined ? { role } : {}) },
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    });
    return json({ ...user, createdAt: user.createdAt.toISOString() });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const me = await requireRole("ADMIN");
    const { id } = await params;
    assertNotSelf(id, me.id);

    const target = await db.user.findUnique({ where: { id }, select: { id: true, role: true } });
    if (!target) throw new ApiError(404, "User not found");
    if (target.role === "ADMIN") await assertNotLastAdmin(id);

    // Archive (don't hard-delete) if the user has run POS sessions (order history).
    const sessions = await db.posSession.count({ where: { userId: id } });
    if (sessions > 0) {
      const user = await db.user.update({
        where: { id },
        data: { active: false },
        select: { id: true, active: true },
      });
      return json({ archived: true, user });
    }
    await db.user.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (e) {
    return errorResponse(e);
  }
}
