// Admin: list payment-method settings. See docs/apis/admin/payment-methods/route.md.
import { db } from "@/lib/db";
import { errorResponse, json, requireRole } from "@/lib/api";

const METHODS = ["CASH", "CARD", "UPI"] as const;

export async function GET() {
  try {
    await requireRole("ADMIN");
    const rows = await db.paymentMethodSetting.findMany();
    const byMethod = new Map(rows.map((r) => [r.method, r]));
    // Always return all three (missing rows default to enabled) so the UI is stable.
    const settings = METHODS.map((method) => {
      const r = byMethod.get(method);
      return {
        method,
        enabled: r?.enabled ?? true,
        upiId: r?.upiId ?? null,
        label: r?.label ?? null,
      };
    });
    return json({ settings });
  } catch (e) {
    return errorResponse(e);
  }
}
