"use client";

import { useKitchenTickets } from "./_hooks/useKitchenTickets";
import { TicketCard } from "./_components/TicketCard";

export default function KdsPage() {
  const state = useKitchenTickets();
  const { phase, tickets, advance } = state;
  const errorMessage = state.phase === "error" ? state.message : null;

  const toCook = tickets.filter((t) => t.kitchenStatus === "TO_COOK");
  const preparing = tickets.filter((t) => t.kitchenStatus === "PREPARING");

  return (
    <div className="min-h-screen bg-[oklch(0.22_0.02_45)] text-[oklch(0.95_0.01_84)]">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[oklch(0.2_0.02_45)]/90 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🍳</span>
          <div>
            <h1 className="font-heading text-xl font-bold tracking-wide">Kitchen Display</h1>
            <p className="text-xs text-white/50">Odoo Cafe</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-white/60">
          <span className={`inline-block h-2 w-2 rounded-full ${phase === "error" ? "bg-red-500" : "bg-emerald-400 animate-pulse"}`} />
          {errorMessage ?? "Live · refreshing every 3s"}
        </div>
      </header>

      {/* Content */}
      <div className="p-6">
        {phase === "loading" && tickets.length === 0 && (
          <p className="mt-20 text-center text-white/40">Loading tickets…</p>
        )}

        {phase !== "loading" && tickets.length === 0 && (
          <div className="mt-24 flex flex-col items-center justify-center gap-3 text-white/40">
            <span className="text-6xl">🍽️</span>
            <p className="text-lg font-medium text-white/70">No active tickets</p>
            <p className="text-sm">Waiting for orders from the POS terminal…</p>
          </div>
        )}

        {tickets.length > 0 && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* To Cook column */}
            <section>
              <div className="mb-4 flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <h2 className="font-heading text-lg font-semibold">To Cook</h2>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-white/70">{toCook.length}</span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {toCook.map((ticket) => (
                  <TicketCard key={ticket.orderId} ticket={ticket} onAdvance={advance} />
                ))}
                {toCook.length === 0 && (
                  <p className="text-sm text-white/30">Nothing queued.</p>
                )}
              </div>
            </section>

            {/* Preparing column */}
            <section>
              <div className="mb-4 flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-orange-400" />
                <h2 className="font-heading text-lg font-semibold">Preparing</h2>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-white/70">{preparing.length}</span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {preparing.map((ticket) => (
                  <TicketCard key={ticket.orderId} ticket={ticket} onAdvance={advance} />
                ))}
                {preparing.length === 0 && (
                  <p className="text-sm text-white/30">Nothing in progress.</p>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
