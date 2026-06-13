"use client";

import { useEffect, useReducer } from "react";
import type { KitchenTicket } from "@/lib/api-types";

const MONO = "'Courier Prime', 'Courier New', Courier, monospace";

const CONFIG = {
  TO_COOK: {
    bg: "#FFFCE8",
    border: "#E8A800",
    badgeBg: "rgba(232,168,0,0.18)",
    badgeColor: "#8B5E00",
    timerColor: "#8B5E00",
    tearBg: "#FFFCE8",
    btnLabel: "Start Preparing",
    btnColor: "#1A0A04",
    btnBorderColor: "rgba(92,48,32,0.22)",
  },
  PREPARING: {
    bg: "#FFF4F0",
    border: "#C41A1A",
    badgeBg: "rgba(196,26,26,0.10)",
    badgeColor: "#C41A1A",
    timerColor: "#C41A1A",
    tearBg: "#FFF4F0",
    btnLabel: "Mark Complete",
    btnColor: "#16803C",
    btnBorderColor: "rgba(22,128,60,0.28)",
  },
  COMPLETED: {
    bg: "#F1FBF4",
    border: "#16803C",
    badgeBg: "rgba(22,128,60,0.12)",
    badgeColor: "#16803C",
    timerColor: "#16803C",
    tearBg: "#F1FBF4",
    btnLabel: "",
    btnColor: "#16803C",
    btnBorderColor: "rgba(22,128,60,0.28)",
  },
} as const;

function ElapsedTimer({ createdAt, status }: { createdAt: string; status: "TO_COOK" | "PREPARING" | "COMPLETED" }) {
  const [nowMs, dispatchNow] = useReducer((_: number, n: number) => n, 0);

  useEffect(() => {
    const update = () => dispatchNow(Date.now());
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  if (nowMs === 0) return null;

  const secs = Math.floor((nowMs - new Date(createdAt).getTime()) / 1000);
  const mins = Math.floor(secs / 60);
  const label = mins > 0 ? `${mins}m ${secs % 60}s` : `${secs}s`;
  const cfg = CONFIG[status];
  const isWarn = mins >= 8;
  const color = isWarn ? "#C41A1A" : cfg.timerColor;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        fontFamily: MONO,
        fontSize: "0.6875rem",
        fontWeight: 700,
        letterSpacing: "0.04em",
        color,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
          display: "inline-block",
        }}
      />
      {label}
    </div>
  );
}

interface Props {
  ticket: KitchenTicket;
  onAdvance: (orderId: string, round: number, status: KitchenTicket["kitchenStatus"]) => void;
}

export function TicketCard({ ticket, onAdvance }: Props) {
  const status = ticket.kitchenStatus;
  if (status !== "TO_COOK" && status !== "PREPARING" && status !== "COMPLETED") return null;

  const cfg = CONFIG[status];
  const label = status === "TO_COOK" ? "To Cook" : status === "PREPARING" ? "Preparing" : "Completed";
  const timeStr = new Date(ticket.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div>
      {/* Ticket body */}
      <div
        style={{
          borderRadius: "10px 10px 0 0",
          border: `2px solid ${cfg.border}`,
          background: cfg.bg,
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Header row — table is what the cook plates for; order # + round identify the batch */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  color: "#1A0A04",
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                }}
              >
                Table {ticket.tableNumber}
              </span>
              <span style={{ fontFamily: "var(--font-body)", fontSize: "0.6875rem", color: "#7A5C3A" }}>
                #{ticket.number} · Round {ticket.round}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <span style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "#7A5C3A" }}>
                {timeStr}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  borderRadius: 4,
                  padding: "2px 7px",
                  letterSpacing: "0.03em",
                  background: cfg.badgeBg,
                  color: cfg.badgeColor,
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </span>
            </div>
          </div>

          {/* Receipt area */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <div
              style={{
                fontFamily: MONO,
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#2A1008",
                letterSpacing: "0.01em",
                marginBottom: 1,
              }}
            >
              ODOO CAFE
            </div>
            <div
              style={{
                fontFamily: MONO,
                fontSize: "0.6875rem",
                color: "#7A5C3A",
                marginBottom: 8,
                letterSpacing: "0.01em",
              }}
            >
              KDS #{ticket.number} · R{ticket.round}
            </div>

            <div
              style={{
                fontFamily: MONO,
                fontSize: "0.75rem",
                color: "rgba(92,48,32,0.35)",
                letterSpacing: "0.05em",
                lineHeight: 1,
                overflow: "hidden",
                marginBottom: 6,
              }}
            >
              {"- - - - - - - - - - - - - - - - -"}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 8 }}>
              {ticket.items.map((item) => (
                <div
                  key={item.productId}
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 4,
                    fontFamily: MONO,
                    fontSize: "0.875rem",
                    color: "#1A0A04",
                    lineHeight: 1.4,
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      color: "#2A1008",
                      minWidth: 22,
                      flexShrink: 0,
                      fontSize: "0.8125rem",
                    }}
                  >
                    {item.qty}×
                  </span>
                  <span style={{ flex: 1 }}>{item.name}</span>
                </div>
              ))}
            </div>

            {status === "COMPLETED" ? (
              <div
                style={{
                  display: "flex", alignItems: "center", gap: 5, fontFamily: MONO,
                  fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.04em", color: "#16803C",
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16803C", display: "inline-block" }} />
                Done ✓
              </div>
            ) : (
              <ElapsedTimer createdAt={ticket.createdAt} status={status} />
            )}
          </div>

          {/* Action button — advances THIS round */}
          {cfg.btnLabel && (
          <button
            onClick={() => onAdvance(ticket.orderId, ticket.round, status)}
            style={{
              width: "100%",
              height: 36,
              background: "#fff",
              border: `1.5px solid ${cfg.btnBorderColor}`,
              borderRadius: 7,
              fontFamily: "var(--font-body)",
              fontSize: "0.8125rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              letterSpacing: "0.01em",
              color: cfg.btnColor,
              transition: "background 130ms ease, transform 140ms cubic-bezier(0.34,1.56,0.64,1)",
            }}
          >
            {cfg.btnLabel}
          </button>
          )}
        </div>
      </div>

      {/* Perforated tear bottom edge */}
      <div
        style={{
          height: 14,
          backgroundRepeat: "repeat-x",
          backgroundPosition: "3px 0",
          backgroundSize: "14px 14px",
          backgroundImage: `radial-gradient(circle at 7px 14px, #191C27 7px, ${cfg.tearBg} 7px)`,
        }}
      />
    </div>
  );
}
