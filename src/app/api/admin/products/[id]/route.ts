// Admin product update + delete (archive when referenced by orders).
// See docs/apis/admin/products/[id]/route.md.
import { type NextRequest } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { ApiError, errorResponse, json, requireRole } from "@/lib/api";
import { str, decimalStr, bool } from "@/lib/validate";

const PRODUCT_INCLUDE = {
  category: { select: { id: true, name: true, color: true } },
} as const;

type ProductRow = Prisma.ProductGetPayload<{ include: typeof PRODUCT_INCLUDE }>;

function serialize(p: ProductRow) {
  return {
    id: p.id,
    name: p.name,
    price: p.price.toString(),
    unit: p.unit,
    tax: p.tax.toString(),
    description: p.description,
    sendToKitchen: p.sendToKitchen,
    active: p.active,
    categoryId: p.categoryId,
    category: p.category
      ? { id: p.category.id, name: p.category.name, color: p.category.color }
      : null,
  };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      throw new ApiError(400, "Invalid JSON body");
    }

    const data: Prisma.ProductUncheckedUpdateInput = {};
    if (body.name !== undefined) data.name = str(body.name, "name", { max: 80 });
    if (body.price !== undefined) data.price = new Prisma.Decimal(decimalStr(body.price, "price"));
    if (body.unit !== undefined) data.unit = str(body.unit, "unit", { max: 20 });
    if (body.tax !== undefined) data.tax = new Prisma.Decimal(decimalStr(body.tax, "tax"));
    if (body.description !== undefined) {
      data.description =
        body.description === null ? null : str(body.description, "description", { min: 0, max: 1000 });
    }
    if (body.sendToKitchen !== undefined) data.sendToKitchen = bool(body.sendToKitchen, "sendToKitchen");
    if (body.active !== undefined) data.active = bool(body.active, "active");
    if (body.categoryId !== undefined) {
      const categoryId = str(body.categoryId, "categoryId");
      const exists = await db.category.findUnique({ where: { id: categoryId } });
      if (!exists) throw new ApiError(400, "categoryId not found");
      data.categoryId = categoryId;
    }

    const product = await db.product.update({ where: { id }, data, include: PRODUCT_INCLUDE });
    return json(serialize(product));
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

    // Archive (don't hard-delete) if the product is referenced by order history.
    const refs = await db.orderItem.count({ where: { productId: id } });
    if (refs > 0) {
      const product = await db.product.update({
        where: { id },
        data: { active: false },
        include: PRODUCT_INCLUDE,
      });
      return json({ archived: true, product: serialize(product) });
    }
    await db.product.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (e) {
    return errorResponse(e);
  }
}
