// Admin: update a payment method. See docs/apis/admin/payment-methods/[method]/route.md.
import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ApiError, errorResponse, json, requireRole } from "@/lib/api";
import { oneOf, bool, str } from "@/lib/validate";

const METHODS = ["CASH", "CARD", "UPI"] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ method: string }> },
) {
  try {
    await requireRole("ADMIN");
    const { method: raw } = await params;
    const method = oneOf(raw, "method", METHODS);

    let body: { enabled?: unknown; upiId?: unknown; label?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      throw new ApiError(400, "Invalid JSON body");
    }

    const data: { enabled?: boolean; upiId?: string | null; label?: string | null } = {};
    if (body.enabled !== undefined) data.enabled = bool(body.enabled, "enabled");
    if (body.upiId !== undefined) {
      data.upiId = body.upiId === null ? null : str(body.upiId, "upiId", { max: 100 });
    }
    if (body.label !== undefined) {
      data.label = body.label === null ? null : str(body.label, "label", { max: 60 });
    }

    // Ensure all three rows exist so the "last enabled" count is accurate.
    await Promise.all(
      METHODS.map((m) =>
        db.paymentMethodSetting.upsert({
          where: { method: m },
          update: {},
          create: { method: m, enabled: true, upiId: m === "UPI" ? "cafe@okhdfc" : null },
        }),
      ),
    );
    const current = await db.paymentMethodSetting.findUniqueOrThrow({ where: { method } });

    const resultingEnabled = data.enabled ?? current.enabled;
    const resultingUpiId = data.upiId !== undefined ? data.upiId : current.upiId;

    if (method === "UPI" && resultingEnabled && !resultingUpiId) {
      throw new ApiError(400, "UPI requires a UPI ID before it can be enabled");
    }
    if (!resultingEnabled) {
      const othersEnabled = await db.paymentMethodSetting.count({
        where: { enabled: true, NOT: { method } },
      });
      if (othersEnabled === 0) {
        throw new ApiError(409, "At least one payment method must stay enabled");
      }
    }

    const updated = await db.paymentMethodSetting.update({ where: { method }, data });
    return json({
      method: updated.method,
      enabled: updated.enabled,
      upiId: updated.upiId,
      label: updated.label,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
