'use client';

import { useKitchenTickets } from '@/app/kds/_hooks/useKitchenTickets';
import { TicketCard } from '@/app/kds/_components/TicketCard';

export function KdsClient() {
  const { tickets, loading, error, refetch } = useKitchenTickets(2500);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-zinc-400">
        Loading tickets…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-red-500">
        <p>{error}</p>
        <button
          onClick={refetch}
          className="rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-zinc-400">
        No active kitchen tickets
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 auto-rows-min">
      {tickets.map((ticket) => (
        <TicketCard
          key={ticket.orderId}
          orderId={ticket.orderId}
          number={ticket.number}
          items={ticket.items}
          status={ticket.kitchenStatus}
          onAdvance={refetch}
        />
      ))}
    </div>
  );
}
