// Admin: rename / delete a floor. See docs/apis/admin/floors/[id]/route.md.
import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ApiError, errorResponse, json, requireRole } from "@/lib/api";
import { str } from "@/lib/validate";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    let body: { name?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      throw new ApiError(400, "Invalid JSON body");
    }
    const name = str(body.name, "name", { max: 60 });
    const floor = await db.floor.update({ where: { id }, data: { name } });
    return json({ id: floor.id, name: floor.name });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    // Restrict: a floor with tables can't be deleted (remove its tables first).
    const tableCount = await db.table.count({ where: { floorId: id } });
    if (tableCount > 0) {
      throw new ApiError(409, "Floor still has tables — remove them first");
    }
    await db.floor.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (e) {
    return errorResponse(e);
  }
}
