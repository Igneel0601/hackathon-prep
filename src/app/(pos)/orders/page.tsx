"use client";

import { useRouter } from "next/navigation";
import { useOrders } from "./_hooks/useOrders";

const STATUS_BADGE: Record<string, string> = {
  DRAFT:     "bg-yellow-100 text-yellow-800",
  PAID:      "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-700",
};

const KITCHEN_BADGE: Record<string, string> = {
  NONE:      "bg-gray-100 text-gray-500",
  TO_COOK:   "bg-yellow-100 text-yellow-700",
  PREPARING: "bg-orange-100 text-orange-700",
  COMPLETED: "bg-green-100 text-green-700",
};

export default function OrdersPage() {
  const router = useRouter();
  const { refetch, ...state } = useOrders();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-gray-500 hover:text-gray-800"
          >
            ← Tables
          </button>
          <h1 className="text-xl font-bold text-gray-900">Session Orders</h1>
          <button
            onClick={refetch}
            className="ml-auto rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            ↻ Refresh
          </button>
        </div>

        {state.phase === "loading" && (
          <p className="text-center text-sm text-gray-400 mt-20">Loading orders…</p>
        )}

        {state.phase === "error" && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {state.message} —{" "}
            <button onClick={refetch} className="underline">retry</button>
          </p>
        )}

        {state.phase === "ready" && state.orders.length === 0 && (
          <p className="text-center text-sm text-gray-400 mt-20">No orders this session.</p>
        )}

        {state.phase === "ready" && state.orders.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Order #</th>
                  <th className="px-4 py-3 text-left">Time</th>
                  <th className="px-4 py-3 text-left">Items</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-center">Payment</th>
                  <th className="px-4 py-3 text-center">Kitchen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {state.orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">#{order.number}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {order.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      ₹{parseFloat(order.total).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${KITCHEN_BADGE[order.kitchenStatus] ?? "bg-gray-100 text-gray-600"}`}>
                        {order.kitchenStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
