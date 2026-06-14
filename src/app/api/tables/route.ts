// GET /api/tables — floors with their tables and active-order flag.
// See docs/apis/tables/route.md.
import { db } from "@/lib/db";
import { json, errorResponse, requireUser } from "@/lib/api";

export async function GET() {
  try {
    await requireUser();

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
            _count: {
              select: {
                orders: {
                  where: { status: "DRAFT" },
                },
              },
            },
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
