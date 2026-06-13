import type { NextRequest } from "next/server";
import { ApiError, errorResponse, json, requireEmployee } from "@/lib/api";
import { db } from "@/lib/db";
import type { KitchenStatus } from "@/generated/prisma/client";

const ACTIVE_STATUSES: KitchenStatus[] = ["TO_COOK", "PREPARING"];

const VALID_STATUSES: KitchenStatus[] = [
  "TO_COOK",
  "PREPARING",
  "COMPLETED",
];

export async function GET(request: NextRequest) {
  try {
    await requireEmployee();

    const { searchParams } = request.nextUrl;
    const statusParam = searchParams.get("status");

    let statusFilter: KitchenStatus[];

    if (statusParam !== null) {
      if (!VALID_STATUSES.includes(statusParam as KitchenStatus)) {
        throw new ApiError(
          400,
          "status must be TO_COOK, PREPARING, or COMPLETED",
        );
      }
      statusFilter = [statusParam as KitchenStatus];
    } else {
      statusFilter = ACTIVE_STATUSES;
    }

    const orders = await db.order.findMany({
      where: { kitchenStatus: { in: statusFilter } },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        number: true,
        kitchenStatus: true,
        createdAt: true,
        items: {
          select: {
            productId: true,
            name: true,
            qty: true,
            product: {
              select: { sendToKitchen: true },
            },
          },
        },
      },
    });

    const tickets = orders.map((order) => ({
      orderId: order.id,
      number: order.number,
      kitchenStatus: order.kitchenStatus,
      items: order.items
        .filter((item) => item.product.sendToKitchen)
        .map((item) => ({
          productId: item.productId,
          name: item.name,
          qty: item.qty,
        })),
      createdAt: order.createdAt,
    }));

    return json({ tickets });
  } catch (e) {
    return errorResponse(e);
  }
}
