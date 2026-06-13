'use client';

import { useState } from 'react';
import { sendToKitchen } from '@/lib/api-client';
import type { KitchenStatus } from '@/lib/api-types';

interface SendToKitchenButtonProps {
  orderId: string;
  kitchenStatus: KitchenStatus;
  onSuccess: () => void;
}

export function SendToKitchenButton({ orderId, kitchenStatus, onSuccess }: SendToKitchenButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSend = kitchenStatus === 'NONE';

  async function handleSend() {
    if (!canSend || loading) return;
    setLoading(true);
    setError(null);
    try {
      await sendToKitchen(orderId, 'send');
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  if (!canSend) {
    const label: Record<KitchenStatus, string> = {
      NONE: '',
      TO_COOK: 'Sent',
      PREPARING: 'Preparing',
      COMPLETED: 'Done',
    };
    return (
      <span className="text-xs text-zinc-500 font-medium">{label[kitchenStatus]}</span>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={handleSend}
        disabled={loading}
        className="rounded-md bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Sending…' : 'Send to Kitchen'}
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
