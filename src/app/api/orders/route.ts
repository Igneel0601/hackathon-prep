import { type NextRequest } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  ApiError,
  errorResponse,
  getOpenPosSession,
  json,
  requireEmployee,
} from "@/lib/api";

// ─── Shape helpers ────────────────────────────────────────────────────────────

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

// ─── POST /api/orders ─────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const user = await requireEmployee();
    const session = await getOpenPosSession(user.id);

    let body: {
      tableId?: unknown;
      items?: unknown;
      customerId?: unknown;
      discount?: unknown;
    };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      throw new ApiError(400, "Invalid JSON body");
    }

    const tableId = body.tableId;
    const rawItems = body.items;
    const customerId = body.customerId ?? null;
    const discountRaw = body.discount ?? 0;

    if (!tableId || typeof tableId !== "string") {
      throw new ApiError(400, "tableId is required");
    }
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      throw new ApiError(400, "items must be a non-empty array");
    }

    // Validate items shape
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

    if (
      typeof discountRaw !== "number" ||
      !Number.isFinite(discountRaw) ||
      discountRaw < 0
    ) {
      throw new ApiError(400, "discount must be a non-negative finite number");
    }

    // Validate table exists and is active
    const table = await db.table.findUnique({ where: { id: tableId } });
    if (!table) throw new ApiError(400, `Table "${tableId}" not found`);
    if (!table.active) throw new ApiError(400, `Table "${tableId}" is not active`);

    // Validate customer if provided
    if (customerId !== null) {
      if (typeof customerId !== "string") {
        throw new ApiError(400, "customerId must be a string or null");
      }
      const customer = await db.customer.findUnique({
        where: { id: customerId },
      });
      if (!customer)
        throw new ApiError(400, `Customer "${customerId}" not found`);
    }

    // Load products (validate all exist and are active)
    const productIds = itemInputs.map((i) => i.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, price: true, tax: true, active: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));
    for (const { productId } of itemInputs) {
      const product = productMap.get(productId);
      if (!product) throw new ApiError(400, `Product "${productId}" not found`);
      if (!product.active)
        throw new ApiError(400, `Product "${productId}" is not active`);
    }

    // Compute money with Decimal — no floats
    const ZERO = new Prisma.Decimal(0);
    const discount = new Prisma.Decimal(discountRaw);

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
      };
    });

    const total = subtotal.plus(taxTotal).minus(discount);

    const order = await db.order.create({
      data: {
        tableId,
        sessionId: session.id,
        customerId: customerId as string | null,
        discount,
        subtotal,
        tax: taxTotal,
        total,
        items: { create: itemsData },
      },
      include: ORDER_INCLUDE,
    });

    return json(serializeOrder(order), 201);
  } catch (e) {
    return errorResponse(e);
  }
}

// ─── GET /api/orders ──────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const user = await requireEmployee();
    const session = await getOpenPosSession(user.id);

    const status = request.nextUrl.searchParams.get("status");
    const tableId = request.nextUrl.searchParams.get("tableId");
    const allowedStatuses = ["DRAFT", "PAID", "CANCELLED"];
    if (status && !allowedStatuses.includes(status)) {
      throw new ApiError(
        400,
        `status must be one of: ${allowedStatuses.join(", ")}`,
      );
    }

    const orders = await db.order.findMany({
      where: {
        sessionId: session.id,
        ...(status ? { status: status as "DRAFT" | "PAID" | "CANCELLED" } : {}),
        ...(tableId ? { tableId } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: ORDER_INCLUDE,
    });

    return json(orders.map(serializeOrder));
  } catch (e) {
    return errorResponse(e);
  }
}
