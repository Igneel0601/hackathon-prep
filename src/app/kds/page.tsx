"use client";

import { useRouter } from "next/navigation";
import { useKitchenTickets } from "./_hooks/useKitchenTickets";
import { TicketCard } from "./_components/TicketCard";

export default function KdsPage() {
  const router = useRouter();
  const state = useKitchenTickets();
  const { phase, tickets, advance } = state;
  const errorMessage = state.phase === "error" ? state.message : null;

  const toCook = tickets.filter((t) => t.kitchenStatus === "TO_COOK");
  const preparing = tickets.filter((t) => t.kitchenStatus === "PREPARING");

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "#191C27" }}>
      {/* Header */}
      <header
        className="flex shrink-0 items-center justify-between px-6 py-4"
        style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
            style={{ color: "rgba(250,243,232,0.55)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"/><path d="M12 5l-7 7 7 7"/>
            </svg>
            POS
          </button>
          <h1
            className="text-xl font-extrabold uppercase tracking-wide"
            style={{ fontFamily: "var(--cafe-font-display)", color: "#FAF3E8" }}
          >
            Kitchen Display
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{
              background: phase === "error" ? "#EF4444" : "#4ADE80",
              boxShadow: phase === "error" ? "0 0 6px #EF4444" : "0 0 6px #4ADE80",
            }}
          />
          <span className="text-xs" style={{ color: "rgba(250,243,232,0.50)" }}>
            {errorMessage ?? "Live · refreshing every 3s"}
          </span>
          {tickets.length > 0 && (
            <span
              className="ml-2 rounded-full px-2.5 py-0.5 text-xs font-bold"
              style={{ background: "#FFBC0D", color: "#1A0A04" }}
            >
              {tickets.length} active
            </span>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-5 md:p-6">
        {phase === "loading" && tickets.length === 0 && (
          <p className="mt-24 text-center text-sm" style={{ color: "rgba(250,243,232,0.35)" }}>
            Loading tickets…
          </p>
        )}

        {phase !== "loading" && tickets.length === 0 && (
          <div className="mt-24 flex flex-col items-center gap-3" style={{ color: "rgba(250,243,232,0.35)" }}>
            <span className="text-5xl">🍽️</span>
            <p className="text-lg font-semibold" style={{ fontFamily: "var(--cafe-font-display)", color: "rgba(250,243,232,0.55)" }}>
              No active tickets
            </p>
            <p className="text-sm">Waiting for orders from the POS…</p>
          </div>
        )}

        {tickets.length > 0 && (
          <div className="space-y-6">
            {toCook.length > 0 && (
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: "#FFBC0D", boxShadow: "0 0 6px #FFBC0D" }} />
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#FFBC0D" }}>
                    To Cook — {toCook.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {toCook.map((ticket) => (
                    <TicketCard key={ticket.orderId} ticket={ticket} onAdvance={advance} />
                  ))}
                </div>
              </section>
            )}

            {preparing.length > 0 && (
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: "#F97316", boxShadow: "0 0 6px #F97316" }} />
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#F97316" }}>
                    Preparing — {preparing.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {preparing.map((ticket) => (
                    <TicketCard key={ticket.orderId} ticket={ticket} onAdvance={advance} />
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
