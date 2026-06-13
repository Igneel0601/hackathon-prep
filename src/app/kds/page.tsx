"use client";

import { useKitchenTickets } from "./_hooks/useKitchenTickets";
import { TicketCard } from "./_components/TicketCard";

export default function KdsPage() {
  const state = useKitchenTickets();
  const { phase, tickets, advance } = state;
  const errorMessage = state.phase === "error" ? state.message : null;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-700 px-6 py-4">
        <h1 className="text-xl font-bold tracking-wide">Kitchen Display</h1>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className={`inline-block h-2 w-2 rounded-full ${phase === "error" ? "bg-red-500" : "bg-green-400"}`} />
          {errorMessage ?? "Live • refreshing every 3s"}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {phase === "loading" && tickets.length === 0 && (
          <p className="text-center text-gray-500 mt-20">Loading tickets…</p>
        )}

        {phase !== "loading" && tickets.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-20 gap-3 text-gray-500">
            <span className="text-5xl">🍽️</span>
            <p className="text-lg">No active tickets</p>
            <p className="text-sm">Waiting for orders from the POS terminal…</p>
          </div>
        )}

        {tickets.length > 0 && (
          <>
            {/* TO_COOK column header */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {tickets
                .filter((t) => t.kitchenStatus === "TO_COOK")
                .map((ticket) => (
                  <TicketCard key={`${ticket.orderId}-${ticket.round}`} ticket={ticket} onAdvance={advance} />
                ))}
              {tickets
                .filter((t) => t.kitchenStatus === "PREPARING")
                .map((ticket) => (
                  <TicketCard key={`${ticket.orderId}-${ticket.round}`} ticket={ticket} onAdvance={advance} />
                ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
