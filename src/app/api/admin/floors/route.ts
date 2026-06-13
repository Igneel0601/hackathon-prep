// Admin: list floors (with tables) + create a floor.
// See docs/apis/admin/floors/route.md.
import { type NextRequest } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { ApiError, errorResponse, json, requireRole } from "@/lib/api";
import { str } from "@/lib/validate";

const FLOOR_INCLUDE = {
  tables: {
    orderBy: { number: "asc" },
    include: { _count: { select: { orders: true } } },
  },
} as const;

type FloorRow = Prisma.FloorGetPayload<{ include: typeof FLOOR_INCLUDE }>;

function serialize(f: FloorRow) {
  return {
    id: f.id,
    name: f.name,
    tables: f.tables.map((t) => ({
      id: t.id,
      number: t.number,
      seats: t.seats,
      active: t.active,
      orderCount: t._count.orders,
    })),
  };
}

export async function GET() {
  try {
    await requireRole("ADMIN");
    const floors = await db.floor.findMany({ include: FLOOR_INCLUDE, orderBy: { name: "asc" } });
    return json({ floors: floors.map(serialize) });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN");
    let body: { name?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      throw new ApiError(400, "Invalid JSON body");
    }
    const name = str(body.name, "name", { max: 60 });
    const floor = await db.floor.create({ data: { name }, include: FLOOR_INCLUDE });
    return json(serialize(floor), 201);
  } catch (e) {
    return errorResponse(e);
  }
}
