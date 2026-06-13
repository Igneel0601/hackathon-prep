import { type NextRequest } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { ApiError, errorResponse, json, requireEmployee } from "@/lib/api";

// ─── Shape helper (shared contract) ──────────────────────────────────────────

function serializeOrder(order: {
  id: string;
  number: number;
  status: string;
  kitchenStatus: string;
  subtotal: Prisma.Decimal;
  tax: Prisma.Decimal;
  discount: Prisma.Decimal;
  total: Prisma.Decimal;
  tableId: string;
  customerId: string | null;
  sessionId: string;
  createdAt: Date;
  updatedAt: Date;
  items: {
    id: string;
    productId: string;
    name: string;
    unitPrice: Prisma.Decimal;
    qty: number;
    lineTotal: Prisma.Decimal;
    round: number;
    kitchenStatus: string;
  }[];
  customer: { id: string; name: string } | null;
}) {
  return {
    id: order.id,
    number: order.number,
    status: order.status,
    kitchenStatus: order.kitchenStatus,
    subtotal: order.subtotal.toString(),
    tax: order.tax.toString(),
    discount: order.discount.toString(),
    total: order.total.toString(),
    tableId: order.tableId,
    customerId: order.customerId,
    sessionId: order.sessionId,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.name,
      unitPrice: item.unitPrice.toString(),
      qty: item.qty,
      lineTotal: item.lineTotal.toString(),
      round: item.round,
      kitchenStatus: item.kitchenStatus,
    })),
    customer: order.customer
      ? { id: order.customer.id, name: order.customer.name }
      : null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

const ORDER_INCLUDE = {
  items: {
    select: {
      id: true,
      productId: true,
      name: true,
      unitPrice: true,
      qty: true,
      lineTotal: true,
      round: true,
      kitchenStatus: true,
    },
  },
  customer: { select: { id: true, name: true } },
} as const;

// ─── PATCH /api/orders/[id] ───────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireEmployee();

    const { id } = await params;

    // Floor-shared: any employee can edit any table's open order (orders belong
    // to the table, not the session). DRAFT/kitchen/CAS guards below still apply.
    const order = await db.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });

    if (!order) {
      throw new ApiError(404, `Order "${id}" not found`);
    }
    if (order.status !== "DRAFT") {
      throw new ApiError(409, "Only draft orders can be edited");
    }

    let body: {
      items?: unknown;
      discount?: unknown;
      customerId?: unknown;
    };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      throw new ApiError(400, "Invalid JSON body");
    }

    const rawItems = body.items;
    const discountRaw = body.discount;
    const customerIdInput = body.customerId;

    // Validate customer update if provided
    let resolvedCustomerId = order.customerId;
    if (customerIdInput !== undefined) {
      if (customerIdInput === null) {
        resolvedCustomerId = null;
      } else if (typeof customerIdInput !== "string") {
        throw new ApiError(400, "customerId must be a string or null");
      } else {
        const customer = await db.customer.findUnique({
          where: { id: customerIdInput },
        });
        if (!customer)
          throw new ApiError(400, `Customer "${customerIdInput}" not found`);
        resolvedCustomerId = customerIdInput;
      }
    }

    // Determine discount
    let discount = order.discount;
    if (discountRaw !== undefined) {
      if (
        typeof discountRaw !== "number" ||
        !Number.isFinite(discountRaw) ||
        discountRaw < 0
      ) {
        throw new ApiError(400, "discount must be a non-negative finite number");
      }
      discount = new Prisma.Decimal(discountRaw);
    }

    // Items already fired to the kitchen (round > 0) are frozen and always kept.
    // `items`, when supplied, is the desired set of UN-FIRED (round 0) lines — it
    // replaces only the editable portion; fired rounds are never touched.
    const firedItems = order.items.filter((it) => it.round > 0);

    let subtotal = order.subtotal;
    let taxTotal = order.tax;
    let newItemsCreateData:
      | {
          productId: string;
          name: string;
          unitPrice: Prisma.Decimal;
          qty: number;
          lineTotal: Prisma.Decimal;
        }[]
      | null = null;

    if (rawItems !== undefined) {
      if (!Array.isArray(rawItems)) {
        throw new ApiError(400, "items must be an array");
      }

      const itemInputs = rawItems.map((item, i) => {
        if (
          !item ||
          typeof item !== "object" ||
          typeof item.productId !== "string" ||
          typeof item.qty !== "number" ||
          !Number.isInteger(item.qty) ||
          item.qty < 1
        ) {
          throw new ApiError(
            400,
            `items[${i}]: productId (string) and qty (positive integer) are required`,
          );
        }
        return { productId: item.productId as string, qty: item.qty as number };
      });

      // Need tax rates for BOTH fired and new items to recompute the bill.
      const allProductIds = [
        ...new Set([
          ...firedItems.map((f) => f.productId),
          ...itemInputs.map((i) => i.productId),
        ]),
      ];
      const products = await db.product.findMany({
        where: { id: { in: allProductIds } },
        select: { id: true, name: true, price: true, tax: true, active: true },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));

      for (const { productId } of itemInputs) {
        const product = productMap.get(productId);
        if (!product) throw new ApiError(400, `Product "${productId}" not found`);
        if (!product.active)
          throw new ApiError(400, `Product "${productId}" is not active`);
      }

      const ZERO = new Prisma.Decimal(0);
      let sub = ZERO;
      let tax = ZERO;

      // Fired lines keep their snapshotted price; tax re-derived from current rate.
      for (const f of firedItems) {
        const lineTotal = new Prisma.Decimal(f.lineTotal.toString());
        const rate = productMap.get(f.productId)?.tax.toString() ?? "0";
        sub = sub.plus(lineTotal);
        tax = tax.plus(lineTotal.times(rate).div(100));
      }

      newItemsCreateData = itemInputs.map(({ productId, qty }) => {
        const product = productMap.get(productId)!;
        const unitPrice = new Prisma.Decimal(product.price.toString());
        const lineTotal = unitPrice.times(qty);
        sub = sub.plus(lineTotal);
        tax = tax.plus(lineTotal.times(product.tax.toString()).div(100));
        return { productId, name: product.name, unitPrice, qty, lineTotal };
      });

      subtotal = sub;
      taxTotal = tax;
    }

    const total = subtotal.plus(taxTotal).minus(discount);
    if (total.lessThan(0)) {
      throw new ApiError(400, "discount cannot exceed the order subtotal + tax");
    }

    // CAS guard: a payment can't land between the read above and this write.
    const updatedOrder = await db.$transaction(async (tx) => {
      const guard = await tx.order.updateMany({
        where: { id, status: "DRAFT" },
        data: { customerId: resolvedCustomerId, discount, subtotal, tax: taxTotal, total },
      });
      if (guard.count === 0) {
        throw new ApiError(409, "Order is no longer editable");
      }

      if (newItemsCreateData !== null) {
        // Replace only the un-fired (round 0) lines; fired rounds stay put.
        await tx.orderItem.deleteMany({ where: { orderId: id, round: 0 } });
        if (newItemsCreateData.length > 0) {
          await tx.orderItem.createMany({
            data: newItemsCreateData.map((item) => ({ ...item, orderId: id, round: 0 })),
          });
        }
      }

      return tx.order.findUniqueOrThrow({ where: { id }, include: ORDER_INCLUDE });
    });

    return json(serializeOrder(updatedOrder));
  } catch (e) {
    return errorResponse(e);
  }
}

// ─── DELETE /api/orders/[id] — void an unpaid order, freeing its table ─────────
//
// "Customer came and went": cancel a DRAFT order so the table reads free again
// (a table is occupied iff it has a DRAFT order). Floor-shared, so any employee
// can void any table's open order. PAID orders can't be voided — they already
// freed the table by leaving DRAFT. CAS-guarded so a payment can't slip in
// between read and write; cancelling also drops the order's KDS tickets (the
// kitchen query excludes CANCELLED).
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireEmployee();
    const { id } = await params;

    const cancelled = await db.order.updateMany({
      where: { id, status: "DRAFT" },
      data: { status: "CANCELLED" },
    });

    if (cancelled.count === 0) {
      // Either it doesn't exist or it's already PAID/CANCELLED.
      const exists = await db.order.findUnique({ where: { id }, select: { status: true } });
      if (!exists) throw new ApiError(404, `Order "${id}" not found`);
      throw new ApiError(409, `Only draft orders can be voided (order is ${exists.status})`);
    }

    return json({ id, status: "CANCELLED" });
  } catch (e) {
    return errorResponse(e);
  }
}
