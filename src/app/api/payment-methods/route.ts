// POS-facing: the payment methods the cashier may offer at checkout.
// See docs/apis/payment-methods/route.md.
import { db } from "@/lib/db";
import { errorResponse, json, requireUser } from "@/lib/api";

const METHODS = ["CASH", "CARD", "UPI"] as const;

export async function GET() {
  try {
    await requireUser();
    const rows = await db.paymentMethodSetting.findMany();

    // Fresh DB (no rows) → default all enabled so the POS isn't blocked.
    const effective =
      rows.length === 0
        ? METHODS.map((method) => ({ method, enabled: true, upiId: null as string | null }))
        : rows;

    const methods = effective
      .filter((r) => r.enabled)
      .map((r) => ({ method: r.method, upiId: r.method === "UPI" ? r.upiId : null }));

    return json({ methods });
  } catch (e) {
    return errorResponse(e);
  }
}
