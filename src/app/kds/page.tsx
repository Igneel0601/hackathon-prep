"use client";

import { useRouter } from "next/navigation";
import { useKitchenTickets } from "./_hooks/useKitchenTickets";
import { TicketCard } from "./_components/TicketCard";
import { PosUserMenu } from "@/components/PosUserMenu";

export default function KdsPage() {
  const router = useRouter();
  const state = useKitchenTickets();
  const { phase, tickets, completed, advance } = state;
  const errorMessage = state.phase === "error" ? state.message : null;

  const toCook = tickets.filter((t) => t.kitchenStatus === "TO_COOK");
  const preparing = tickets.filter((t) => t.kitchenStatus === "PREPARING");

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#191C27" }}>
      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          height: 56,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
          gap: 12,
        }}
      >
        {/* Left */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button
            onClick={() => router.push("/")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              fontSize: "0.8125rem",
              color: "rgba(240,237,232,0.50)",
              padding: "6px 0",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"/><path d="M12 5l-7 7 7 7"/>
            </svg>
            POS
          </button>
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "1.0625rem",
              fontWeight: 700,
              color: "#F0EDE8",
              letterSpacing: "-0.01em",
            }}
          >
            Kitchen Display
          </span>
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Stats */}
          {tickets.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "rgba(240,237,232,0.40)" }}>
                To Cook: <span style={{ fontWeight: 700, color: "rgba(240,237,232,0.80)" }}>{toCook.length}</span>
              </span>
              <span style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "rgba(240,237,232,0.40)" }}>
                Preparing: <span style={{ fontWeight: 700, color: "rgba(240,237,232,0.80)" }}>{preparing.length}</span>
              </span>
            </div>
          )}

          {/* Live badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: "var(--font-body)", fontSize: "0.8125rem", color: "rgba(240,237,232,0.55)" }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: phase === "error" ? "#EF4444" : "#4ade80",
                boxShadow: phase === "error" ? "0 0 6px #EF4444" : "0 0 6px #4ade80",
                flexShrink: 0,
                display: "inline-block",
              }}
            />
            {errorMessage ?? "Live · 3s"}
          </div>

          {/* + New Order */}
          <button
            onClick={() => router.push("/")}
            style={{
              height: 32,
              padding: "0 14px",
              background: "rgba(255,188,13,0.12)",
              border: "1px solid rgba(255,188,13,0.25)",
              borderRadius: 8,
              fontFamily: "var(--font-body)",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "#FFBC0D",
              cursor: "pointer",
              letterSpacing: "0.02em",
              whiteSpace: "nowrap",
            }}
          >
            + New Order
          </button>

          {/* Account menu */}
          <PosUserMenu />
        </div>
      </header>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 32px" }}>
        {phase === "loading" && tickets.length === 0 && (
          <p style={{ marginTop: 96, textAlign: "center", fontSize: "0.875rem", color: "rgba(240,237,232,0.35)" }}>
            Loading tickets…
          </p>
        )}

        {phase !== "loading" && tickets.length === 0 && completed.length === 0 && (
          <div style={{ marginTop: 96, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, opacity: 0.4 }}>
            <span style={{ fontSize: "2.5rem" }}>🍽️</span>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9375rem", color: "#F0EDE8" }}>
              No active tickets
            </p>
            <p style={{ fontSize: "0.8125rem", color: "rgba(240,237,232,0.65)" }}>Waiting for orders from the POS…</p>
          </div>
        )}

        {(tickets.length > 0 || completed.length > 0) && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {toCook.length > 0 && (
              <section>
                <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FFBC0D", boxShadow: "0 0 6px #FFBC0D", display: "inline-block" }} />
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "#FFBC0D" }}>
                    To Cook — {toCook.length}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14, alignItems: "start" }} className="sm:grid-cols-3 lg:grid-cols-4">
                  {toCook.map((ticket) => (
                    <TicketCard key={`${ticket.orderId}-${ticket.round}`} ticket={ticket} onAdvance={advance} />
                  ))}
                </div>
              </section>
            )}

            {preparing.length > 0 && (
              <section>
                <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#C41A1A", boxShadow: "0 0 6px #C41A1A", display: "inline-block" }} />
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "#C41A1A" }}>
                    Preparing — {preparing.length}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14, alignItems: "start" }} className="sm:grid-cols-3 lg:grid-cols-4">
                  {preparing.map((ticket) => (
                    <TicketCard key={`${ticket.orderId}-${ticket.round}`} ticket={ticket} onAdvance={advance} />
                  ))}
                </div>
              </section>
            )}

            {completed.length > 0 && (
              <section>
                <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#16803C", boxShadow: "0 0 6px #16803C", display: "inline-block" }} />
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "#16803C" }}>
                    Completed — {completed.length}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14, alignItems: "start" }} className="sm:grid-cols-3 lg:grid-cols-4">
                  {completed.map((ticket) => (
                    <TicketCard key={`${ticket.orderId}-${ticket.round}`} ticket={ticket} onAdvance={advance} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
