// Admin category update + delete. See docs/apis/admin/categories/[id]/route.md.
import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ApiError, errorResponse, json, requireRole } from "@/lib/api";
import { str } from "@/lib/validate";

type CategoryWithCount = {
  id: string;
  name: string;
  color: string;
  _count: { products: number };
};

function serialize(c: CategoryWithCount) {
  return { id: c.id, name: c.name, color: c.color, productCount: c._count.products };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    let body: { name?: unknown; color?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      throw new ApiError(400, "Invalid JSON body");
    }

    const data: { name?: string; color?: string } = {};
    if (body.name !== undefined) data.name = str(body.name, "name", { max: 60 });
    if (body.color !== undefined) data.color = str(body.color, "color", { max: 20 });

    const category = await db.category.update({
      where: { id },
      data,
      include: { _count: { select: { products: true } } },
    });
    return json(serialize(category));
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

    // Restrict: a category with products can't be deleted (would orphan the menu).
    const productCount = await db.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      throw new ApiError(409, "Category has products — reassign or remove them first");
    }
    await db.category.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (e) {
    return errorResponse(e);
  }
}
