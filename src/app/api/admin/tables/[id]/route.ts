// Admin: update / delete a table. See docs/apis/admin/tables/[id]/route.md.
import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ApiError, errorResponse, json, requireRole } from "@/lib/api";
import { int, bool } from "@/lib/validate";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    let body: { number?: unknown; seats?: unknown; active?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      throw new ApiError(400, "Invalid JSON body");
    }
    const data: { number?: number; seats?: number; active?: boolean } = {};
    if (body.number !== undefined) data.number = int(body.number, "number", { min: 1 });
    if (body.seats !== undefined) data.seats = int(body.seats, "seats", { min: 1 });
    if (body.active !== undefined) data.active = bool(body.active, "active");

    const table = await db.table.update({ where: { id }, data });
    return json({ id: table.id, number: table.number, seats: table.seats, active: table.active });
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
    // Archive if the table has order history; else hard-delete.
    const orderCount = await db.order.count({ where: { tableId: id } });
    if (orderCount > 0) {
      const table = await db.table.update({ where: { id }, data: { active: false } });
      return json({ archived: true, table: { id: table.id, active: table.active } });
    }
    await db.table.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (e) {
    return errorResponse(e);
  }
}
