import { Prisma } from "@/generated/prisma/client";
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

    // Floor-shared: any employee can take payment for any table's order.
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

    // Reject methods the admin has disabled (even if a stale client offers them).
    const setting = await db.paymentMethodSetting.findUnique({ where: { method } });
    if (setting && !setting.enabled) {
      throw new ApiError(409, `${method} payments are currently disabled`);
    }

    let changeDue: Prisma.Decimal | null = null;

    if (method === "CASH") {
      if (body.amountReceived === undefined || body.amountReceived === null) {
        throw new ApiError(400, "amountReceived is required for CASH payments");
      }
      if (
        typeof body.amountReceived !== "number" &&
        typeof body.amountReceived !== "string"
      ) {
        throw new ApiError(400, "amountReceived must be a number or numeric string");
      }
      let received: Prisma.Decimal;
      try {
        received = new Prisma.Decimal(String(body.amountReceived));
      } catch {
        throw new ApiError(400, "amountReceived must be a valid number");
      }
      const total = new Prisma.Decimal(order.total.toString());
      if (received.lessThan(total)) {
        throw new ApiError(400, "amountReceived is less than order total");
      }
      changeDue = received.minus(total);
    }

    const reference =
      typeof body.reference === "string" ? body.reference : undefined;

    // Atomic: flip DRAFT→PAID only if still DRAFT, so two concurrent payments
    // can't both succeed. If the guard matches nothing, the order was already paid.
    const { updatedOrder, payment } = await db.$transaction(async (tx) => {
      const flipped = await tx.order.updateMany({
        where: { id, status: "DRAFT" },
        data: { status: "PAID" },
      });
      if (flipped.count === 0) {
        throw new ApiError(409, "Order is not payable");
      }
      const updatedOrder = await tx.order.findUniqueOrThrow({
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
      const payment = await tx.payment.create({
        data: {
          method,
          amount: new Prisma.Decimal(order.total.toString()),
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
      });
      return { updatedOrder, payment };
    });

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
