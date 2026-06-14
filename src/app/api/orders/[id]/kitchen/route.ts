import { ApiError, errorResponse, json, requireEmployee } from "@/lib/api";
import { db } from "@/lib/db";
import type { KitchenStatus } from "@/generated/prisma/client";

// Order-level kitchen state = the least-advanced fired round (NONE until first fire).
const RANK: Record<KitchenStatus, number> = { NONE: 0, TO_COOK: 1, PREPARING: 2, COMPLETED: 3 };
function aggregate(items: { round: number; kitchenStatus: KitchenStatus }[]): KitchenStatus {
  const fired = items.filter((it) => it.round > 0);
  if (fired.length === 0) return "NONE";
  return fired.reduce<KitchenStatus>(
    (min, it) => (RANK[it.kitchenStatus] < RANK[min] ? it.kitchenStatus : min),
    "COMPLETED",
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireEmployee();
    const { id } = await params;

    const order = await db.order.findUnique({
      where: { id },
      select: {
        id: true,
        number: true,
        status: true,
        items: { select: { round: true, kitchenStatus: true } },
      },
    });
    if (!order) throw new ApiError(404, "Order not found");
    if (order.status === "CANCELLED") {
      throw new ApiError(409, "Order is cancelled");
    }

    const body = (await request.json()) as { action?: unknown; round?: unknown };
    const action = body.action;

    if (action === "send") {
      // Can only fire NEW items while the order is still open (unpaid).
      if (order.status !== "DRAFT") {
        throw new ApiError(409, "Order is closed — can't send new items");
      }
      // Fire every un-fired (round 0) line as the next round.
      const unfired = order.items.filter((it) => it.round === 0);
      if (unfired.length === 0) {
        throw new ApiError(409, "Nothing new to send to the kitchen");
      }
      const nextRound = order.items.reduce((m, it) => Math.max(m, it.round), 0) + 1;
      await db.orderItem.updateMany({
        where: { orderId: id, round: 0 },
        data: { round: nextRound, kitchenStatus: "TO_COOK" },
      });
    } else if (action === "advance") {
      const round = body.round;
      if (typeof round !== "number" || !Number.isInteger(round) || round < 1) {
        throw new ApiError(400, "advance requires a positive integer round");
      }
      const roundItems = order.items.filter((it) => it.round === round);
      if (roundItems.length === 0) {
        throw new ApiError(404, `No round ${round} on this order`);
      }
      const current = roundItems[0].kitchenStatus;
      if (current === "NONE") throw new ApiError(409, "Round not sent yet");
      if (current === "COMPLETED") throw new ApiError(409, "Round already completed");
      const next: KitchenStatus = current === "TO_COOK" ? "PREPARING" : "COMPLETED";
      // CAS: only step the round if it's still where we read it.
      const moved = await db.orderItem.updateMany({
        where: { orderId: id, round, kitchenStatus: current },
        data: { kitchenStatus: next },
      });
      if (moved.count === 0) {
        throw new ApiError(409, "Kitchen status changed concurrently, retry");
      }
    } else {
      throw new ApiError(400, 'action must be "send" or "advance"');
    }

    // Refresh + recompute the order-level aggregate so the POS can flip to checkout.
    const after = await db.order.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        number: true,
        status: true,
        items: { select: { round: true, kitchenStatus: true } },
      },
    });
    const kitchenStatus = aggregate(after.items);
    await db.order.update({ where: { id }, data: { kitchenStatus } });

    return json({
      id: after.id,
      number: after.number,
      status: after.status,
      kitchenStatus,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
