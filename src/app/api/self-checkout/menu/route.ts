// GET /api/self-checkout/menu — active products + categories for the public
// self-checkout kiosk. No auth (unauthenticated guests order from here).
// See docs/apis/self-checkout/menu/route.md.
import { db } from "@/lib/db";
import { json, errorResponse, ApiError } from "@/lib/api";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function GET(request: Request) {
  try {
    if (!rateLimit(`self-checkout-menu:${clientIp(request)}`, 60, 60_000)) {
      throw new ApiError(429, "Too many requests — please slow down.");
    }
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
