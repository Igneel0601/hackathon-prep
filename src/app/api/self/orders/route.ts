// POST /api/self/orders — PUBLIC self-checkout order (no auth, kiosk-backed).
// Guest picks a FREE table, adds items, gives an email; we create the order and
// fire it to the kitchen in one step. Payment happens at the counter later.
// See docs/apis/self/orders/route.md.
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { ApiError, errorResponse, json } from "@/lib/api";
import { ensureKioskSession } from "@/lib/kiosk";

export async function POST(request: Request) {
  try {
    let body: { tableId?: unknown; items?: unknown; customer?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      throw new ApiError(400, "Invalid JSON body");
    }

    const tableId = body.tableId;
    const rawItems = body.items;
    const customer = body.customer as { email?: unknown; name?: unknown } | undefined;

    if (!tableId || typeof tableId !== "string") {
      throw new ApiError(400, "tableId is required");
    }
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      throw new ApiError(400, "items must be a non-empty array");
    }
    const email = typeof customer?.email === "string" ? customer.email.trim().toLowerCase() : "";
    if (!email || !email.includes("@")) {
      throw new ApiError(400, "a valid email is required");
    }
    const name = typeof customer?.name === "string" && customer.name.trim() ? customer.name.trim() : "Guest";

    // Validate item shapes.
    const itemInputs = rawItems.map((item, i) => {
      if (
        !item ||
        typeof item !== "object" ||
        typeof item.productId !== "string" ||
        typeof item.qty !== "number" ||
        !Number.isInteger(item.qty) ||
        item.qty < 1
      ) {
        throw new ApiError(400, `items[${i}]: productId (string) and qty (positive integer) are required`);
      }
      return { productId: item.productId as string, qty: item.qty as number };
    });

    // Table must exist + be active.
    const table = await db.table.findUnique({ where: { id: tableId } });
    if (!table) throw new ApiError(400, `Table "${tableId}" not found`);
    if (!table.active) throw new ApiError(400, "That table is not available");

    // Self-checkout only on FREE tables — block if one already has an open order.
    const occupied = await db.order.findFirst({
      where: { tableId, status: "DRAFT" },
      select: { id: true },
    });
    if (occupied) {
      throw new ApiError(409, "That table already has an open order — please pick another or ask staff.");
    }

    // Load + validate products.
    const productIds = itemInputs.map((i) => i.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, price: true, tax: true, active: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));
    for (const { productId } of itemInputs) {
      const product = productMap.get(productId);
      if (!product) throw new ApiError(400, `Product "${productId}" not found`);
      if (!product.active) throw new ApiError(400, `Product "${productId}" is not available`);
    }

    // Money with Decimal — no floats.
    const ZERO = new Prisma.Decimal(0);
    let subtotal = ZERO;
    let taxTotal = ZERO;
    const itemsData = itemInputs.map(({ productId, qty }) => {
      const product = productMap.get(productId)!;
      const unitPrice = new Prisma.Decimal(product.price.toString());
      const lineTotal = unitPrice.times(qty);
      const lineTax = lineTotal.times(product.tax.toString()).div(100);
      subtotal = subtotal.plus(lineTotal);
      taxTotal = taxTotal.plus(lineTax);
      // Fired immediately as round 1 → straight to the kitchen.
      return { productId, name: product.name, unitPrice, qty, lineTotal, round: 1, kitchenStatus: "TO_COOK" as const };
    });
    const total = subtotal.plus(taxTotal);

    // Find-or-create the customer by email (Customer.email is not unique).
    const existingCustomer = await db.customer.findFirst({ where: { email }, select: { id: true } });
    const customerId =
      existingCustomer?.id ?? (await db.customer.create({ data: { name, email }, select: { id: true } })).id;

    const { sessionId } = await ensureKioskSession();

    let order;
    try {
      order = await db.order.create({
        data: {
          tableId,
          sessionId,
          customerId,
          discount: ZERO,
          subtotal,
          tax: taxTotal,
          total,
          kitchenStatus: "TO_COOK", // already fired
          items: { create: itemsData },
        },
        select: { id: true, number: true },
      });
    } catch (e) {
      // Lost the race against another order opening this table (partial-unique).
      if (e && typeof e === "object" && "code" in e && (e as { code: unknown }).code === "P2002") {
        throw new ApiError(409, "That table already has an open order — please pick another or ask staff.");
      }
      throw e;
    }

    return json({ id: order.id, number: order.number }, 201);
  } catch (e) {
    return errorResponse(e);
  }
}
