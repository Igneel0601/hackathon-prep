import type { NextRequest } from "next/server";
import { ApiError, errorResponse, json, requireEmployee } from "@/lib/api";
import { db } from "@/lib/db";
import type { KitchenStatus } from "@/generated/prisma/client";

const ACTIVE_STATUSES: KitchenStatus[] = ["TO_COOK", "PREPARING"];
const VALID_STATUSES: KitchenStatus[] = ["TO_COOK", "PREPARING", "COMPLETED"];

export async function GET(request: NextRequest) {
  try {
    await requireEmployee();

    const statusParam = request.nextUrl.searchParams.get("status");
    let statusFilter: KitchenStatus[];
    if (statusParam !== null) {
      if (!VALID_STATUSES.includes(statusParam as KitchenStatus)) {
        throw new ApiError(400, "status must be TO_COOK, PREPARING, or COMPLETED");
      }
      statusFilter = [statusParam as KitchenStatus];
    } else {
      statusFilter = ACTIVE_STATUSES;
    }

    // Orders with at least one item in the requested kitchen state → one ticket
    // per (order, round), so each fire batch is its own card on the display.
    const orders = await db.order.findMany({
      where: {
        // Payment-agnostic: a paid-but-still-cooking order must stay on the board
        // until the kitchen marks it done. Only a cancelled order drops off.
        status: { not: "CANCELLED" },
        items: { some: { kitchenStatus: { in: statusFilter } } },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        number: true,
        createdAt: true,
        table: { select: { number: true } },
        items: {
          where: { kitchenStatus: { in: statusFilter } },
          select: {
            productId: true,
            name: true,
            qty: true,
            round: true,
            kitchenStatus: true,
            product: { select: { sendToKitchen: true } },
          },
        },
      },
    });

    const tickets = orders.flatMap((order) => {
      const byRound = new Map<number, typeof order.items>();
      for (const it of order.items) {
        if (!it.product.sendToKitchen) continue;
        const arr = byRound.get(it.round) ?? [];
        arr.push(it);
        byRound.set(it.round, arr);
      }
      return [...byRound.entries()].map(([round, items]) => ({
        orderId: order.id,
        number: order.number,
        round,
        tableNumber: order.table.number,
        kitchenStatus: items[0].kitchenStatus,
        items: items.map((it) => ({ productId: it.productId, name: it.name, qty: it.qty })),
        createdAt: order.createdAt,
      }));
    });

    return json({ tickets });
  } catch (e) {
    return errorResponse(e);
  }
}
