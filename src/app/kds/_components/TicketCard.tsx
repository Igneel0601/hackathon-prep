"use client";

import type { KitchenTicket } from "@/lib/api-types";

const STATUS_CONFIG = {
  NONE: {
    label: "Queued",
    cardBg: "rgba(255,255,255,0.04)",
    cardBorder: "rgba(255,255,255,0.08)",
    badgeBg: "rgba(255,255,255,0.08)",
    badgeColor: "rgba(250,243,232,0.55)",
    btn: "",
    btnBg: "",
    btnColor: "",
  },
  TO_COOK: {
    label: "To Cook",
    cardBg: "rgba(255,188,13,0.06)",
    cardBorder: "rgba(255,188,13,0.30)",
    badgeBg: "rgba(255,188,13,0.15)",
    badgeColor: "#FFBC0D",
    btn: "🍳 Start Preparing",
    btnBg: "#FFBC0D",
    btnColor: "#1A0A04",
  },
  PREPARING: {
    label: "Preparing",
    cardBg: "rgba(249,115,22,0.06)",
    cardBorder: "rgba(249,115,22,0.30)",
    badgeBg: "rgba(249,115,22,0.15)",
    badgeColor: "#F97316",
    btn: "✅ Mark Complete",
    btnBg: "#F97316",
    btnColor: "#fff",
  },
  COMPLETED: {
    label: "Completed",
    cardBg: "rgba(74,222,128,0.04)",
    cardBorder: "rgba(74,222,128,0.20)",
    badgeBg: "rgba(74,222,128,0.12)",
    badgeColor: "#4ADE80",
    btn: "",
    btnBg: "",
    btnColor: "",
  },
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
      className="flex flex-col gap-3 rounded-2xl p-4"
      style={{
        background: cfg.cardBg,
        border: `1.5px solid ${cfg.cardBorder}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xl font-extrabold" style={{ fontFamily: "var(--cafe-font-display)", color: "#FAF3E8" }}>
          #{ticket.number}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "rgba(250,243,232,0.40)" }}>{timeStr}</span>
          <span
            className="rounded-full px-2 py-0.5 text-xs font-bold"
            style={{ background: cfg.badgeBg, color: cfg.badgeColor }}
          >
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Items */}
      <ul className="space-y-1.5">
        {ticket.items.map((item) => (
          <li key={item.productId} className="flex items-center gap-2.5 text-sm">
            <span
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-xs font-bold"
              style={{ background: "rgba(255,255,255,0.08)", color: "#FFBC0D" }}
            >
              {item.qty}
            </span>
            <span style={{ color: "rgba(250,243,232,0.85)" }}>{item.name}</span>
          </li>
        ))}
      </ul>

      {cfg.btn && (
        <button
          onClick={() => onAdvance(ticket.orderId, ticket.kitchenStatus)}
          className="mt-auto w-full rounded-xl py-2.5 text-sm font-bold transition-opacity hover:opacity-90"
          style={{ background: cfg.btnBg, color: cfg.btnColor }}
        >
          {cfg.btn}
        </button>
      )}
    </div>
  );
}
