// Admin products CRUD (list + create, incl. on-the-fly category).
// See docs/apis/admin/products/route.md.
import { type NextRequest } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { ApiError, errorResponse, json, requireRole } from "@/lib/api";
import { str, decimalStr, bool, optional } from "@/lib/validate";

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

export async function GET(request: NextRequest) {
  try {
    await requireRole("ADMIN");
    const sp = request.nextUrl.searchParams;
    const q = sp.get("q")?.trim();
    const categoryId = sp.get("categoryId");
    const activeParam = sp.get("active");
    const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(sp.get("pageSize") ?? "50", 10) || 50));

    const where: Prisma.ProductWhereInput = {
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(activeParam === "true"
        ? { active: true }
        : activeParam === "false"
          ? { active: false }
          : {}),
    };

    const [rows, total] = await Promise.all([
      db.product.findMany({
        where,
        include: PRODUCT_INCLUDE,
        orderBy: { name: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.product.count({ where }),
    ]);
    return json({ data: rows.map(serialize), total, page, pageSize });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN");
    let body: {
      name?: unknown;
      price?: unknown;
      unit?: unknown;
      tax?: unknown;
      description?: unknown;
      sendToKitchen?: unknown;
      categoryId?: unknown;
      newCategory?: { name?: unknown; color?: unknown };
    };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      throw new ApiError(400, "Invalid JSON body");
    }

    const name = str(body.name, "name", { max: 80 });
    const price = decimalStr(body.price, "price");
    const unit = optional(body.unit, (v) => str(v, "unit", { max: 20 })) ?? "piece";
    const tax = body.tax === undefined ? "0" : decimalStr(body.tax, "tax");
    const description =
      optional(body.description, (v) => str(v, "description", { min: 0, max: 1000 })) ?? null;
    const sendToKitchen =
      body.sendToKitchen === undefined ? true : bool(body.sendToKitchen, "sendToKitchen");

    // Exactly one of categoryId / newCategory.
    const hasCategoryId = typeof body.categoryId === "string" && body.categoryId.length > 0;
    const hasNew = !!body.newCategory && typeof body.newCategory === "object";
    if (hasCategoryId === hasNew) {
      throw new ApiError(400, "Provide either categoryId or newCategory");
    }

    const product = await db.$transaction(async (tx) => {
      let categoryId: string;
      if (hasNew) {
        const nc = body.newCategory!;
        const created = await tx.category.create({
          data: {
            name: str(nc.name, "newCategory.name", { max: 60 }),
            color: optional(nc.color, (v) => str(v, "newCategory.color", { max: 20 })) ?? "#6b7280",
          },
        });
        categoryId = created.id;
      } else {
        categoryId = body.categoryId as string;
        const exists = await tx.category.findUnique({ where: { id: categoryId } });
        if (!exists) throw new ApiError(400, "categoryId not found");
      }
      return tx.product.create({
        data: {
          name,
          price: new Prisma.Decimal(price),
          unit,
          tax: new Prisma.Decimal(tax),
          description,
          sendToKitchen,
          categoryId,
        },
        include: PRODUCT_INCLUDE,
      });
    });
    return json(serialize(product), 201);
  } catch (e) {
    return errorResponse(e);
  }
}
