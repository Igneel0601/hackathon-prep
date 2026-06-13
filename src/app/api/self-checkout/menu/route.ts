// GET /api/self-checkout/menu — active products + categories for the public
// self-checkout kiosk. No auth (unauthenticated guests order from here).
// See docs/apis/self-checkout/menu/route.md.
import { db } from "@/lib/db";
import { json, errorResponse } from "@/lib/api";

export async function GET() {
  try {
    const [categories, products] = await Promise.all([
      db.category.findMany({
        select: { id: true, name: true, color: true },
        orderBy: { name: "asc" },
      }),
      db.product.findMany({
        where: { active: true },
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
    ]);

    return json({ categories, products });
  } catch (e) {
    return errorResponse(e);
  }
}
