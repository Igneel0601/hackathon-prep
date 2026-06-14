"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useAdminPaymentMethods } from "./_hooks/useAdminPaymentMethods";
import type { PaymentMethodSettingDTO } from "@/lib/api-types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const LABELS: Record<string, string> = { CASH: "💵 Cash", CARD: "💳 Card", UPI: "📱 UPI" };

export default function PaymentMethodsPage() {
  const { settings, loading, error, update } = useAdminPaymentMethods();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900">Payment Methods</h1>
      <p className="text-sm text-gray-500">Toggle which methods the POS checkout offers.</p>

      {loading && <p className="mt-6 text-sm text-gray-400">Loading…</p>}
      {error && <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      {!loading && (
        <div className="mt-6 max-w-lg space-y-3">
          {settings.map((s) => (
            <MethodRow key={s.method} setting={s} update={update} />
          ))}
        </div>
      )}
    </div>
  );
}

function MethodRow({
  setting,
  update,
}: {
  setting: PaymentMethodSettingDTO;
  update: (method: string, body: { enabled?: boolean; upiId?: string | null }) => Promise<unknown>;
}) {
  const [upiId, setUpiId] = useState(setting.upiId ?? "");
  const [err, setErr] = useState<string | null>(null);

  async function call(body: { enabled?: boolean; upiId?: string | null }) {
    setErr(null);
    try {
      await update(setting.method, body);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Update failed");
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="font-medium text-gray-900">{LABELS[setting.method] ?? setting.method}</span>
        <Switch checked={setting.enabled} onCheckedChange={(v) => call({ enabled: v })} />
      </div>

      {setting.method === "UPI" && (
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-xs text-gray-500">UPI ID</label>
            <div className="mt-1 flex gap-2">
              <Input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="cafe@okhdfc" />
              <Button variant="outline" onClick={() => call({ upiId: upiId.trim() || null })}>
                Save
              </Button>
            </div>
          </div>
          {setting.upiId && (
            <div className="rounded-lg border border-gray-100 p-2">
              <QRCodeSVG value={`upi://pay?pa=${setting.upiId}&cu=INR`} size={72} />
            </div>
          )}
        </div>
      )}
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
    </div>
  );
}
