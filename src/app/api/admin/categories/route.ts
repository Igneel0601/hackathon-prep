// Admin categories CRUD (list + create). See docs/apis/admin/categories/route.md.
import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ApiError, errorResponse, json, requireRole } from "@/lib/api";
import { str, optional } from "@/lib/validate";

type CategoryWithCount = {
  id: string;
  name: string;
  color: string;
  _count: { products: number };
};

function serialize(c: CategoryWithCount) {
  return { id: c.id, name: c.name, color: c.color, productCount: c._count.products };
}

export async function GET() {
  try {
    await requireRole("ADMIN");
    const categories = await db.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    });
    return json({ categories: categories.map(serialize) });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN");
    let body: { name?: unknown; color?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      throw new ApiError(400, "Invalid JSON body");
    }
    const name = str(body.name, "name", { max: 60 });
    const color = optional(body.color, (v) => str(v, "color", { max: 20 })) ?? "#6b7280";

    const category = await db.category.create({
      data: { name, color },
      include: { _count: { select: { products: true } } },
    });
    return json(serialize(category), 201);
  } catch (e) {
    return errorResponse(e);
  }
}
