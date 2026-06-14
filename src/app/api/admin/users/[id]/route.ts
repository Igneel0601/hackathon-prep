// Admin: update / delete a user. See docs/apis/admin/users/[id]/route.md.
import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ApiError, errorResponse, json, requireRole } from "@/lib/api";
import { str, oneOf, optional } from "@/lib/validate";
import { assertNotSelf } from "@/lib/admin-guards";

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
    // Lock the active-admin rows so two concurrent demotions can't both pass the
    // "another admin still exists" check and strand the cafe with zero admins.
    const user = await db.$transaction(async (tx) => {
      if (role === "EMPLOYEE") {
        await tx.$queryRaw`SELECT id FROM "User" WHERE "role" = 'ADMIN' AND "active" = true FOR UPDATE`;
        const target = await tx.user.findUnique({ where: { id }, select: { role: true } });
        if (target?.role === "ADMIN") {
          assertNotSelf(id, me.id);
          const others = await tx.user.count({
            where: { role: "ADMIN", active: true, NOT: { id } },
          });
          if (others === 0) throw new ApiError(409, "Can't remove the last active admin");
        }
      }
      return tx.user.update({
        where: { id },
        data: { ...(name !== undefined ? { name } : {}), ...(role !== undefined ? { role } : {}) },
        select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
      });
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

    const result = await db.$transaction(async (tx) => {
      const target = await tx.user.findUnique({ where: { id }, select: { id: true, role: true } });
      if (!target) throw new ApiError(404, "User not found");
      if (target.role === "ADMIN") {
        // Lock active admins so concurrent deletes can't drop the last one.
        await tx.$queryRaw`SELECT id FROM "User" WHERE "role" = 'ADMIN' AND "active" = true FOR UPDATE`;
        const others = await tx.user.count({
          where: { role: "ADMIN", active: true, NOT: { id } },
        });
        if (others === 0) throw new ApiError(409, "Can't remove the last active admin");
      }

      // Archive (don't hard-delete) if the user has run POS sessions (order history).
      const sessions = await tx.posSession.count({ where: { userId: id } });
      if (sessions > 0) {
        const user = await tx.user.update({
          where: { id },
          data: { active: false },
          select: { id: true, active: true },
        });
        return { archived: true as const, user };
      }
      await tx.user.delete({ where: { id } });
      return null;
    });

    if (result) return json(result);
    return new Response(null, { status: 204 });
  } catch (e) {
    return errorResponse(e);
  }
}
