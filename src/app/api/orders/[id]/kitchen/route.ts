import { ApiError, errorResponse, json, requireEmployee } from "@/lib/api";
import { db } from "@/lib/db";

type KitchenAction = "send" | "advance";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireEmployee();
    const { id } = await params;

    const order = await db.order.findUnique({ where: { id } });
    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    const body = (await request.json()) as { action?: unknown };
    const action = body.action as KitchenAction;

    if (action !== "send" && action !== "advance") {
      throw new ApiError(400, 'action must be "send" or "advance"');
    }

    let nextStatus: "TO_COOK" | "PREPARING" | "COMPLETED";

    if (action === "send") {
      if (order.kitchenStatus !== "NONE") {
        throw new ApiError(409, "Order already sent to kitchen");
      }
      nextStatus = "TO_COOK";
    } else {
      // advance
      if (order.kitchenStatus === "NONE") {
        throw new ApiError(409, "Send to kitchen first");
      }
      if (order.kitchenStatus === "COMPLETED") {
        throw new ApiError(409, "Already completed");
      }
      // TO_COOK → PREPARING, PREPARING → COMPLETED
      nextStatus =
        order.kitchenStatus === "TO_COOK" ? "PREPARING" : "COMPLETED";
    }

    // Atomic: only transition if kitchenStatus is still what we read, so two
    // concurrent advances can't double-step the ticket.
    const moved = await db.order.updateMany({
      where: { id, kitchenStatus: order.kitchenStatus },
      data: { kitchenStatus: nextStatus },
    });
    if (moved.count === 0) {
      throw new ApiError(409, "Kitchen status changed concurrently, retry");
    }

    const updated = await db.order.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        number: true,
        status: true,
        kitchenStatus: true,
      },
    });

    return json(updated);
  } catch (e) {
    return errorResponse(e);
  }
}
