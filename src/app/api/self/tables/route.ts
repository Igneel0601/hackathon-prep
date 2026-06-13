// GET /api/self/tables — PUBLIC floors + tables for the kiosk (no auth).
// Same shape as /api/tables (active-order flag drives free/occupied).
// See docs/apis/self/tables/route.md.
import { db } from "@/lib/db";
import { json, errorResponse } from "@/lib/api";

export async function GET() {
  try {
    const floors = await db.floor.findMany({
      select: {
        id: true,
        name: true,
        tables: {
          select: {
            id: true,
            number: true,
            seats: true,
            active: true,
            _count: { select: { orders: { where: { status: "DRAFT" } } } },
          },
          orderBy: { number: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    const result = floors.map((floor) => ({
      id: floor.id,
      name: floor.name,
      tables: floor.tables.map((table) => ({
        id: table.id,
        number: table.number,
        seats: table.seats,
        active: table.active,
        hasActiveOrder: table._count.orders > 0,
      })),
    }));

    return json({ floors: result });
  } catch (e) {
    return errorResponse(e);
  }
}
