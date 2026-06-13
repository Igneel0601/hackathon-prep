'use client';

import { useState } from 'react';
import { sendToKitchen } from '@/lib/api-client';
import type { KitchenStatus } from '@/lib/api-types';

interface TicketCardProps {
  orderId: string;
  number: number;
  items: { name: string; qty: number }[];
  status: KitchenStatus;
  onAdvance: () => void;
}

const STATUS_STYLES: Record<KitchenStatus, string> = {
  NONE: 'border-zinc-300 bg-white',
  TO_COOK: 'border-yellow-400 bg-yellow-50',
  PREPARING: 'border-orange-400 bg-orange-50',
  COMPLETED: 'border-green-400 bg-green-50',
};

const STATUS_LABEL: Record<KitchenStatus, string> = {
  NONE: 'None',
  TO_COOK: 'To Cook',
  PREPARING: 'Preparing',
  COMPLETED: 'Completed',
};

const STATUS_BADGE: Record<KitchenStatus, string> = {
  NONE: 'bg-zinc-100 text-zinc-600',
  TO_COOK: 'bg-yellow-100 text-yellow-800',
  PREPARING: 'bg-orange-100 text-orange-800',
  COMPLETED: 'bg-green-100 text-green-800',
};

export function TicketCard({ orderId, number, items, status, onAdvance }: TicketCardProps) {
  const [advancing, setAdvancing] = useState(false);

  const canAdvance = status === 'TO_COOK' || status === 'PREPARING';

  async function handleAdvance() {
    if (!canAdvance || advancing) return;
    setAdvancing(true);
    try {
      await sendToKitchen(orderId, 'advance');
      onAdvance();
    } catch (err) {
      console.error('Advance failed:', err);
    } finally {
      setAdvancing(false);
    }
  }

  return (
    <div
      data-testid="ticket-card"
      className={`rounded-xl border-2 p-4 flex flex-col gap-3 shadow-sm ${STATUS_STYLES[status]}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-zinc-900">#{number}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[status]}`}>
          {STATUS_LABEL[status]}
        </span>
      </div>

      <ul className="flex flex-col gap-1">
        {items.map((item, i) => (
          <li key={i} className="flex justify-between text-sm text-zinc-700">
            <span>{item.name}</span>
            <span className="font-medium">×{item.qty}</span>
          </li>
        ))}
      </ul>

      {canAdvance && (
        <button
          onClick={handleAdvance}
          disabled={advancing}
          className="mt-auto w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          {advancing ? 'Updating…' : status === 'TO_COOK' ? 'Start Preparing' : 'Mark Complete'}
        </button>
      )}

      {status === 'COMPLETED' && (
        <div className="mt-auto text-center text-sm font-medium text-green-700">Done</div>
      )}
    </div>
  );
}
