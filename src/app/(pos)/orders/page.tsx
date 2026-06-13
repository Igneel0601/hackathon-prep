import type { Metadata } from 'next';
import { OrdersClient } from './_components/OrdersClient';

export const metadata: Metadata = {
  title: 'Orders | Cafe POS',
};

export default function OrdersPage() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-xl font-bold text-zinc-900">Orders</h1>
      <OrdersClient />
    </div>
  );
}
