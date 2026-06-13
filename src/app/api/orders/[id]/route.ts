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
  items: {
    id: string;
    productId: string;
    name: string;
    unitPrice: Prisma.Decimal;
    qty: number;
    lineTotal: Prisma.Decimal;
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
    })),
    customer: order.customer
      ? { id: order.customer.id, name: order.customer.name }
      : null,
    createdAt: order.createdAt.toISOString(),
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

    // Items already sent to the kitchen are being cooked — block changes to them
    // (discount/customer may still be edited). kitchenStatus is the cooking state.
    if (rawItems !== undefined && order.kitchenStatus !== "NONE") {
      throw new ApiError(409, "Items already sent to kitchen and can't be changed");
    }

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

    // If items provided, validate + recompute; otherwise keep existing totals
    let subtotal = order.subtotal;
    let taxTotal = order.tax;
    let itemsCreateData:
      | {
          productId: string;
          name: string;
          unitPrice: Prisma.Decimal;
          qty: number;
          lineTotal: Prisma.Decimal;
        }[]
      | null = null;

    if (rawItems !== undefined) {
      if (!Array.isArray(rawItems) || rawItems.length === 0) {
        throw new ApiError(400, "items must be a non-empty array");
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

      const productIds = itemInputs.map((i) => i.productId);
      const products = await db.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, price: true, tax: true, active: true },
      });

      const productMap = new Map(products.map((p) => [p.id, p]));
      for (const { productId } of itemInputs) {
        const product = productMap.get(productId);
        if (!product)
          throw new ApiError(400, `Product "${productId}" not found`);
        if (!product.active)
          throw new ApiError(400, `Product "${productId}" is not active`);
      }

      const ZERO = new Prisma.Decimal(0);
      let newSubtotal = ZERO;
      let newTax = ZERO;

      itemsCreateData = itemInputs.map(({ productId, qty }) => {
        const product = productMap.get(productId)!;
        const unitPrice = new Prisma.Decimal(product.price.toString());
        const lineTotal = unitPrice.times(qty);
        const lineTax = lineTotal.times(product.tax.toString()).div(100);
        newSubtotal = newSubtotal.plus(lineTotal);
        newTax = newTax.plus(lineTax);
        return { productId, name: product.name, unitPrice, qty, lineTotal };
      });

      subtotal = newSubtotal;
      taxTotal = newTax;
    } else if (discountRaw !== undefined) {
      // Only discount changed — recompute total from existing subtotal/tax
      // (subtotal/tax unchanged; just need new total)
    }

    const total = subtotal.plus(taxTotal).minus(discount);
    if (total.lessThan(0)) {
      throw new ApiError(400, "discount cannot exceed the order subtotal + tax");
    }

    // Transactional update with a compare-and-swap guard: updateMany can put
    // `status` in the WHERE (order.update can't), so a payment landing between
    // the read above and this write makes the guard match 0 rows → 409, instead
    // of silently editing a now-PAID order or losing a concurrent edit.
    const updatedOrder = await db.$transaction(async (tx) => {
      const guard = await tx.order.updateMany({
        where: { id, status: "DRAFT" },
        data: { customerId: resolvedCustomerId, discount, subtotal, tax: taxTotal, total },
      });
      if (guard.count === 0) {
        throw new ApiError(409, "Order is no longer editable");
      }

      if (itemsCreateData !== null) {
        await tx.orderItem.deleteMany({ where: { orderId: id } });
        await tx.orderItem.createMany({
          data: itemsCreateData.map((item) => ({ ...item, orderId: id })),
        });
      }

      return tx.order.findUniqueOrThrow({ where: { id }, include: ORDER_INCLUDE });
    });

    return json(serializeOrder(updatedOrder));
  } catch (e) {
    return errorResponse(e);
  }
}
