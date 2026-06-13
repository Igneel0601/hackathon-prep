"use client";

import type { KitchenTicket } from "@/lib/api-types";

const STATUS_CONFIG = {
  NONE:      { label: "Queued",    bg: "bg-gray-50",   border: "border-gray-300",   badge: "bg-gray-100 text-gray-700",      btn: "" },
  TO_COOK:   { label: "To Cook",   bg: "bg-yellow-50", border: "border-yellow-300", badge: "bg-yellow-100 text-yellow-800",  btn: "🍳 Start Preparing" },
  PREPARING: { label: "Preparing", bg: "bg-orange-50", border: "border-orange-300", badge: "bg-orange-100 text-orange-800",  btn: "✅ Mark Complete" },
  COMPLETED: { label: "Completed", bg: "bg-green-50",  border: "border-green-300",  badge: "bg-green-100 text-green-800",   btn: "" },
} as const;

interface Props {
  ticket: KitchenTicket;
  onAdvance: (orderId: string, round: number, status: KitchenTicket["kitchenStatus"]) => void;
}

export function TicketCard({ ticket, onAdvance }: Props) {
  const cfg = STATUS_CONFIG[ticket.kitchenStatus];
  const timeStr = new Date(ticket.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={`flex flex-col rounded-xl border-2 ${cfg.border} ${cfg.bg} p-4 gap-3`}>
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-lg font-bold text-gray-900">Table {ticket.tableNumber}</span>
          <span className="text-xs text-gray-500">#{ticket.number} · Round {ticket.round}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{timeStr}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.badge}`}>
            {cfg.label}
          </span>
        </div>
      </div>

      <ul className="space-y-1">
        {ticket.items.map((item) => (
          <li key={item.productId} className="flex items-center gap-2 text-sm text-gray-800">
            <span className="w-6 text-center font-bold text-gray-600">{item.qty}×</span>
            <span>{item.name}</span>
          </li>
        ))}
      </ul>

      {cfg.btn && (
        <button
          onClick={() => onAdvance(ticket.orderId, ticket.round, ticket.kitchenStatus)}
          className="mt-auto w-full rounded-lg bg-white py-2 text-sm font-semibold text-gray-800 shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          {cfg.btn}
        </button>
      )}
    </div>
  );
}
