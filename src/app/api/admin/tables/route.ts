// Admin: create a table. See docs/apis/admin/tables/route.md.
import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ApiError, errorResponse, json, requireRole } from "@/lib/api";
import { int, bool, optional } from "@/lib/validate";

export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN");
    let body: { floorId?: unknown; number?: unknown; seats?: unknown; active?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      throw new ApiError(400, "Invalid JSON body");
    }
    const floorId = typeof body.floorId === "string" && body.floorId ? body.floorId : null;
    if (!floorId) throw new ApiError(400, "floorId is required");
    const number = int(body.number, "number", { min: 1 });
    const seats = optional(body.seats, (v) => int(v, "seats", { min: 1 })) ?? 4;
    const active = optional(body.active, (v) => bool(v, "active")) ?? true;

    const floor = await db.floor.findUnique({ where: { id: floorId } });
    if (!floor) throw new ApiError(400, "floorId not found");

    const table = await db.table.create({
      data: { floorId, number, seats, active },
    });
    return json(
      { id: table.id, number: table.number, seats: table.seats, active: table.active, orderCount: 0 },
      201,
    );
  } catch (e) {
    return errorResponse(e);
  }
}
