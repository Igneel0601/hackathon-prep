"use client";

import type { KitchenTicket } from "@/lib/api-types";

const STATUS_CONFIG = {
  NONE:      { label: "Queued",    accent: "bg-gray-400",   badge: "bg-gray-100 text-gray-700",     btn: "" },
  TO_COOK:   { label: "To Cook",   accent: "bg-amber-400",  badge: "bg-amber-100 text-amber-800",   btn: "🍳 Start Preparing" },
  PREPARING: { label: "Preparing", accent: "bg-orange-400", badge: "bg-orange-100 text-orange-800", btn: "✅ Mark Complete" },
  COMPLETED: { label: "Completed", accent: "bg-emerald-400",badge: "bg-emerald-100 text-emerald-800", btn: "" },
} as const;

interface Props {
  ticket: KitchenTicket;
  onAdvance: (orderId: string, status: KitchenTicket["kitchenStatus"]) => void;
}

export function TicketCard({ ticket, onAdvance }: Props) {
  const cfg = STATUS_CONFIG[ticket.kitchenStatus];
  const timeStr = new Date(ticket.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      data-testid="ticket-card"
      className="flex flex-col overflow-hidden rounded-2xl bg-[oklch(0.97_0.012_84)] text-gray-900 shadow-lg shadow-black/20 animate-rise"
    >
      {/* Accent strip */}
      <div className={`h-1.5 w-full ${cfg.accent}`} />

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <span className="font-heading text-xl font-bold">#{ticket.number}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{timeStr}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.badge}`}>
              {cfg.label}
            </span>
          </div>
        </div>

        <ul className="space-y-1.5">
          {ticket.items.map((item) => (
            <li key={item.productId} className="flex items-center gap-2 text-sm text-gray-800">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gray-900/5 text-xs font-bold text-gray-700">
                {item.qty}
              </span>
              <span>{item.name}</span>
            </li>
          ))}
        </ul>

        {cfg.btn && (
          <button
            onClick={() => onAdvance(ticket.orderId, ticket.kitchenStatus)}
            className="mt-auto w-full rounded-xl bg-gray-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 active:scale-[0.98]"
          >
            {cfg.btn}
          </button>
        )}
      </div>
    </div>
  );
}
