import { Decimal } from "@prisma/client/runtime/client";
import { ApiError, errorResponse, json, requireEmployee } from "@/lib/api";
import { db } from "@/lib/db";

type PaymentMethod = "CASH" | "CARD" | "UPI";

interface PaymentBody {
  method?: unknown;
  amountReceived?: unknown;
  reference?: unknown;
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
        kitchenStatus: true,
        subtotal: true,
        tax: true,
        discount: true,
        total: true,
      },
    });

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    if (order.status !== "DRAFT") {
      throw new ApiError(409, "Order is not payable");
    }

    const body = (await request.json()) as PaymentBody;
    const method = body.method as PaymentMethod;

    if (!["CASH", "CARD", "UPI"].includes(method)) {
      throw new ApiError(400, 'method must be "CASH", "CARD", or "UPI"');
    }

    let changeDue: Decimal | null = null;

    if (method === "CASH") {
      if (body.amountReceived === undefined || body.amountReceived === null) {
        throw new ApiError(400, "amountReceived is required for CASH payments");
      }
      if (
        typeof body.amountReceived !== "number" &&
        typeof body.amountReceived !== "string"
      ) {
        throw new ApiError(400, "amountReceived must be a number");
      }
      const received = new Decimal(String(body.amountReceived));
      const total = new Decimal(order.total.toString());
      if (received.lessThan(total)) {
        throw new ApiError(400, "amountReceived is less than order total");
      }
      changeDue = received.minus(total);
    }

    const reference =
      typeof body.reference === "string" ? body.reference : undefined;

    const [updatedOrder, payment] = await db.$transaction([
      db.order.update({
        where: { id },
        data: { status: "PAID" },
        select: {
          id: true,
          number: true,
          status: true,
          kitchenStatus: true,
          subtotal: true,
          tax: true,
          discount: true,
          total: true,
        },
      }),
      db.payment.create({
        data: {
          method,
          amount: new Decimal(order.total.toString()),
          reference: reference ?? null,
          changeDue: changeDue,
          orderId: id,
        },
        select: {
          id: true,
          method: true,
          amount: true,
          reference: true,
          changeDue: true,
          createdAt: true,
        },
      }),
    ]);

    return json({
      order: {
        ...updatedOrder,
        subtotal: updatedOrder.subtotal.toString(),
        tax: updatedOrder.tax.toString(),
        discount: updatedOrder.discount.toString(),
        total: updatedOrder.total.toString(),
      },
      payment: {
        ...payment,
        amount: payment.amount.toString(),
        changeDue: payment.changeDue?.toString() ?? null,
      },
      changeDue: changeDue?.toString() ?? null,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
