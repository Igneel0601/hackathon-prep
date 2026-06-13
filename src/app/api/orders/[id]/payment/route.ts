import { Prisma } from "@/generated/prisma/client";
import { ApiError, errorResponse, json, requireEmployee } from "@/lib/api";
import { db } from "@/lib/db";
import { sendReceiptEmail } from "@/lib/mailer";

type PaymentMethod = "CASH" | "CARD" | "UPI";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface PaymentBody {
  method?: unknown;
  amountReceived?: unknown;
  reference?: unknown;
  email?: unknown;
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

    let email: string | undefined;
    if (typeof body.email === "string" && body.email.trim()) {
      email = body.email.trim().toLowerCase();
      if (!EMAIL_RE.test(email)) {
        throw new ApiError(400, "email must be a valid email address");
      }
    }

    // Atomic: flip DRAFT→PAID only if still DRAFT, so two concurrent payments
    // can't both succeed. If the guard matches nothing, the order was already paid.
    const { updatedOrder, payment } = await db.$transaction(async (tx) => {
      const flipped = await tx.order.updateMany({
        where: { id, status: "DRAFT" },
        data: { status: "PAID", kitchenStatus: "COMPLETED" },
      });
      if (flipped.count === 0) {
        throw new ApiError(409, "Order is not payable");
      }
      // Checkout closes the kitchen ticket too — mark any items still
      // TO_COOK/PREPARING as COMPLETED so the order drops off the KDS.
      await tx.orderItem.updateMany({
        where: { orderId: id, kitchenStatus: { in: ["TO_COOK", "PREPARING"] } },
        data: { kitchenStatus: "COMPLETED" },
      });
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
          table: { select: { number: true } },
          items: { select: { name: true, qty: true, lineTotal: true } },
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

    // Best-effort receipt email — never block the payment on SMTP issues.
    if (email) {
      try {
        await sendReceiptEmail({
          to: email,
          orderNumber: updatedOrder.number,
          tableNumber: updatedOrder.table.number,
          items: updatedOrder.items.map((i) => ({ name: i.name, qty: i.qty, lineTotal: i.lineTotal.toString() })),
          subtotal: updatedOrder.subtotal.toString(),
          tax: updatedOrder.tax.toString(),
          total: updatedOrder.total.toString(),
          paid: {
            method: payment.method,
            amount: payment.amount.toString(),
            changeDue: payment.changeDue?.toString() ?? null,
          },
        });
      } catch (e) {
        console.error("[orders/payment] failed to send receipt email:", e);
      }
    }

    return json({
      order: {
        id: updatedOrder.id,
        number: updatedOrder.number,
        status: updatedOrder.status,
        kitchenStatus: updatedOrder.kitchenStatus,
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
