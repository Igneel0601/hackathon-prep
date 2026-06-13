// GET /api/self-checkout/tables — active tables with a free/occupied flag, for
// the public self-checkout kiosk's table picker. No auth.
// See docs/apis/self-checkout/tables/route.md.
import { db } from "@/lib/db";
import { json, errorResponse, ApiError } from "@/lib/api";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function GET(request: Request) {
  try {
    if (!rateLimit(`self-checkout-tables:${clientIp(request)}`, 60, 60_000)) {
      throw new ApiError(429, "Too many requests — please slow down.");
    }
    const floors = await db.floor.findMany({
      select: {
        id: true,
        name: true,
        tables: {
          where: { active: true },
          select: {
            id: true,
            number: true,
            seats: true,
            active: true,
            _count: {
              select: { orders: { where: { status: "DRAFT" } } },
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
