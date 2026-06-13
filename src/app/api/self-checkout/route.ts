// POST /api/self-checkout — public kiosk order. Guest picks a free table +
// items, gives an email for the receipt. No login, no payment here (cashier
// takes payment at the table as normal). See docs/apis/self-checkout/route.md.
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { ApiError, errorResponse, json } from "@/lib/api";
import { getKioskSession } from "@/lib/kiosk";
import { sendReceiptEmail } from "@/lib/mailer";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// This endpoint is PUBLIC and unauthenticated, fires straight to the kitchen,
// and sends email — so it carries the same bounds as POST /api/self/orders.
const MAX_ITEMS = 50;
const MAX_QTY = 99;
const MAX_ORDERS_PER_MIN = 10; // per device/IP
const MAX_EMAILS_PER_HOUR = 5; // per email address — blunt using our SMTP to bomb a victim

export async function POST(request: Request) {
  try {
    // Per-device throttle: stops scripted kitchen/email flooding.
    if (!rateLimit(`self-checkout:${clientIp(request)}`, MAX_ORDERS_PER_MIN, 60_000)) {
      throw new ApiError(429, "Too many orders from this device — please wait a moment.");
    }

    let body: { email?: unknown; tableId?: unknown; items?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      throw new ApiError(400, "Invalid JSON body");
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || !EMAIL_RE.test(email)) {
      throw new ApiError(400, "a valid email is required");
    }
    // Per-recipient throttle: the `to` address is attacker-controlled, so cap how
    // often we'll email any one address through our SMTP (anti-bombing / reputation).
    if (!rateLimit(`self-checkout-email:${email}`, MAX_EMAILS_PER_HOUR, 3_600_000)) {
      throw new ApiError(429, "Too many receipts requested for this email — please wait.");
    }

    const tableId = body.tableId;
    if (!tableId || typeof tableId !== "string") {
      throw new ApiError(400, "tableId is required");
    }

    const rawItems = body.items;
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      throw new ApiError(400, "items must be a non-empty array");
    }
    if (rawItems.length > MAX_ITEMS) {
      throw new ApiError(400, `too many items (max ${MAX_ITEMS} per order)`);
    }
    const itemInputs = rawItems.map((item, i) => {
      if (
        !item ||
        typeof item !== "object" ||
        typeof item.productId !== "string" ||
        typeof item.qty !== "number" ||
        !Number.isInteger(item.qty) ||
        item.qty < 1 ||
        item.qty > MAX_QTY
      ) {
        throw new ApiError(
          400,
          `items[${i}]: productId (string) and qty (integer 1–${MAX_QTY}) are required`,
        );
      }
      return { productId: item.productId as string, qty: item.qty as number };
    });

    // Table must exist, be active, and currently free (no open DRAFT order).
    const table = await db.table.findUnique({
      where: { id: tableId },
      include: { _count: { select: { orders: { where: { status: "DRAFT" } } } } },
    });
    if (!table) throw new ApiError(400, `Table "${tableId}" not found`);
    if (!table.active) throw new ApiError(400, `Table "${tableId}" is not active`);
    if (table._count.orders > 0) {
      throw new ApiError(409, "This table is already occupied — pick another");
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
      if (!product.active) throw new ApiError(400, `Product "${productId}" is not active`);
    }

    // Money — Decimal, no floats.
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
      return {
        productId,
        name: product.name,
        unitPrice,
        qty,
        lineTotal,
        // Fire straight to the kitchen — no cashier needed to send round 1.
        round: 1,
        kitchenStatus: "TO_COOK" as const,
      };
    });
    const total = subtotal.plus(taxTotal);

    const session = await getKioskSession();

    // One Customer per email — reuse if they've ordered before.
    let customer = await db.customer.findFirst({ where: { email } });
    if (!customer) {
      customer = await db.customer.create({ data: { name: email, email } });
    }

    let order;
    try {
      order = await db.order.create({
        data: {
          tableId,
          sessionId: session.id,
          customerId: customer.id,
          subtotal,
          tax: taxTotal,
          total,
          kitchenStatus: "TO_COOK",
          items: { create: itemsData },
        },
        select: {
          id: true,
          number: true,
          subtotal: true,
          tax: true,
          total: true,
          table: { select: { number: true } },
          items: { select: { name: true, qty: true, lineTotal: true } },
        },
      });
    } catch (e) {
      if (e && typeof e === "object" && "code" in e && (e as { code: unknown }).code === "P2002") {
        throw new ApiError(409, "This table is already occupied — pick another");
      }
      throw e;
    }

    try {
      await sendReceiptEmail({
        to: email,
        orderNumber: order.number,
        tableNumber: order.table.number,
        items: order.items.map((i) => ({
          name: i.name,
          qty: i.qty,
          lineTotal: i.lineTotal.toString(),
        })),
        subtotal: order.subtotal.toString(),
        tax: order.tax.toString(),
        total: order.total.toString(),
      });
    } catch (e) {
      // Order is placed either way — email is best-effort.
      console.error("[self-checkout] failed to send receipt email:", e);
    }

    return json(
      {
        orderNumber: order.number,
        tableNumber: order.table.number,
        subtotal: order.subtotal.toString(),
        tax: order.tax.toString(),
        total: order.total.toString(),
      },
      201,
    );
  } catch (e) {
    return errorResponse(e);
  }
}
