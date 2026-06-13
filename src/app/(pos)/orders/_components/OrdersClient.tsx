'use client';

import { useState, useEffect, useCallback } from 'react';
import { getOrders } from '@/lib/api-client';
import type { Order } from '@/lib/api-types';
import { SendToKitchenButton } from './SendToKitchenButton';

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export function OrdersClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await getOrders();
      setOrders(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  if (loading) {
    return <div className="flex h-40 items-center justify-center text-zinc-400">Loading orders…</div>;
  }

  if (error) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-3 text-red-500">
        <p>{error}</p>
        <button
          onClick={fetchOrders}
          className="rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return <div className="flex h-40 items-center justify-center text-zinc-400">No orders yet</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left border-collapse">
        <thead>
          <tr className="border-b border-zinc-200 text-zinc-500 uppercase text-xs">
            <th className="px-4 py-3 font-medium">#</th>
            <th className="px-4 py-3 font-medium">Table</th>
            <th className="px-4 py-3 font-medium">Items</th>
            <th className="px-4 py-3 font-medium">Total</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Kitchen</th>
            <th className="px-4 py-3 font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-zinc-100 hover:bg-zinc-50">
              <td className="px-4 py-3 font-semibold text-zinc-900">#{order.number}</td>
              <td className="px-4 py-3 text-zinc-600">{order.tableId}</td>
              <td className="px-4 py-3 text-zinc-600">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</td>
              <td className="px-4 py-3 font-medium text-zinc-900">₹{order.total}</td>
              <td className="px-4 py-3">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[order.status] ?? ''}`}>
                  {order.status}
                </span>
              </td>
              <td className="px-4 py-3 text-zinc-500 text-xs">{order.kitchenStatus.replace('_', ' ')}</td>
              <td className="px-4 py-3">
                <SendToKitchenButton
                  orderId={order.id}
                  kitchenStatus={order.kitchenStatus}
                  onSuccess={fetchOrders}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
