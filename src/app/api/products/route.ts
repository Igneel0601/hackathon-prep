// GET /api/products — list active products + all categories.
// See docs/apis/products/route.md.
import { db } from "@/lib/db";
import { json, errorResponse, requireUser } from "@/lib/api";
import { withDbRetry } from "@/lib/db-retry";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await requireUser();

    const { searchParams } = request.nextUrl;
    const categoryId = searchParams.get("categoryId") ?? undefined;

    const [categories, products] = await withDbRetry(() =>
      Promise.all([
        db.category.findMany({
          select: { id: true, name: true, color: true },
          orderBy: { name: "asc" },
        }),
        db.product.findMany({
          where: {
            active: true,
            ...(categoryId ? { categoryId } : {}),
          },
          select: {
            id: true,
            name: true,
            price: true,
            unit: true,
            tax: true,
            description: true,
            sendToKitchen: true,
            categoryId: true,
          },
          orderBy: { name: "asc" },
        }),
      ]),
    );

    return json({ categories, products });
  } catch (e) {
    return errorResponse(e);
  }
}
