"use client";

import { useRouter } from "next/navigation";
import { useOrders } from "./_hooks/useOrders";

const STATUS_BADGE: Record<string, string> = {
  DRAFT:     "bg-amber-100 text-amber-800",
  PAID:      "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-700",
};

const KITCHEN_BADGE: Record<string, string> = {
  NONE:      "bg-gray-100 text-gray-500",
  TO_COOK:   "bg-amber-100 text-amber-700",
  PREPARING: "bg-orange-100 text-orange-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
};

export default function OrdersPage() {
  const router = useRouter();
  const { refetch, ...state } = useOrders();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="flex h-9 items-center gap-1 rounded-full border border-border bg-card px-3 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            ← Tables
          </button>
          <div>
            <h1 className="font-heading text-2xl font-bold text-espresso">Session Orders</h1>
            <p className="text-xs text-muted-foreground">Everything rung up this shift</p>
          </div>
          <button
            onClick={refetch}
            className="ml-auto rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
          >
            ↻ Refresh
          </button>
        </div>

        {state.phase === "loading" && (
          <p className="mt-20 text-center text-sm text-muted-foreground">Loading orders…</p>
        )}

        {state.phase === "error" && (
          <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {state.message} —{" "}
            <button onClick={refetch} className="font-semibold underline">retry</button>
          </p>
        )}

        {state.phase === "ready" && state.orders.length === 0 && (
          <div className="mt-24 flex flex-col items-center gap-2 text-center text-muted-foreground">
            <span className="text-4xl opacity-40">🧾</span>
            <p className="text-sm">No orders this session yet.</p>
          </div>
        )}

        {state.phase === "ready" && state.orders.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-secondary/50 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Order #</th>
                  <th className="px-4 py-3 text-left">Time</th>
                  <th className="px-4 py-3 text-left">Items</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-center">Payment</th>
                  <th className="px-4 py-3 text-center">Kitchen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {state.orders.map((order) => (
                  <tr key={order.id} className="transition-colors hover:bg-secondary/40">
                    <td className="px-4 py-3 font-bold text-espresso">#{order.number}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3 text-foreground/80">
                      {order.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-foreground">
                      ₹{parseFloat(order.total).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${KITCHEN_BADGE[order.kitchenStatus] ?? "bg-gray-100 text-gray-600"}`}>
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
