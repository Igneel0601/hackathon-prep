"use client";

import { useRouter } from "next/navigation";
import { useOrders } from "./_hooks/useOrders";

const PAYMENT_STYLE: Record<string, { bg: string; color: string }> = {
  DRAFT:     { bg: "rgba(255,188,13,0.12)", color: "#FFBC0D" },
  PAID:      { bg: "rgba(22,128,60,0.10)",  color: "#16803C" },
  CANCELLED: { bg: "rgba(196,26,26,0.10)",  color: "#C41A1A" },
};

const KITCHEN_STYLE: Record<string, { bg: string; color: string }> = {
  NONE:      { bg: "rgba(155,107,85,0.10)", color: "#9B6B55" },
  TO_COOK:   { bg: "rgba(255,188,13,0.10)", color: "#B08000" },
  PREPARING: { bg: "rgba(249,115,22,0.10)", color: "#C2570A" },
  COMPLETED: { bg: "rgba(22,128,60,0.10)",  color: "#16803C" },
};

const fallbackStyle = { bg: "rgba(155,107,85,0.08)", color: "#9B6B55" };

export default function OrdersPage() {
  const router = useRouter();
  const { refetch, ...state } = useOrders();

  return (
    <div className="min-h-screen" style={{ background: "#F5F0EB" }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-5 py-4 md:px-8"
        style={{ background: "#FDFAF5", borderBottom: "1px solid rgba(92,48,32,0.10)" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1 text-sm transition-opacity hover:opacity-70"
            style={{ color: "#9B6B55" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"/><path d="M12 5l-7 7 7 7"/>
            </svg>
            Home
          </button>
          <div className="h-4 w-px" style={{ background: "rgba(92,48,32,0.20)" }} />
          <h1 className="font-bold" style={{ fontFamily: "var(--cafe-font-display)", color: "#1A0A04", fontSize: "1.125rem" }}>
            Session Orders
          </h1>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors"
          style={{ background: "#fff", border: "1.5px solid rgba(92,48,32,0.16)", color: "#5C3020" }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>
          </svg>
          Refresh
        </button>
      </header>

      {/* Body */}
      <div className="mx-auto max-w-5xl p-5 md:p-8">
        {state.phase === "loading" && (
          <p className="mt-24 text-center text-sm" style={{ color: "rgba(92,48,32,0.40)" }}>Loading orders…</p>
        )}

        {state.phase === "error" && (
          <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(196,26,26,0.08)", border: "1px solid rgba(196,26,26,0.18)", color: "#C41A1A" }}>
            {state.message} —{" "}
            <button onClick={refetch} className="underline">retry</button>
          </div>
        )}

        {state.phase === "ready" && state.orders.length === 0 && (
          <div className="mt-24 flex flex-col items-center gap-3" style={{ color: "rgba(92,48,32,0.40)" }}>
            <span className="text-5xl">📋</span>
            <p className="text-base font-semibold" style={{ fontFamily: "var(--cafe-font-display)", color: "rgba(92,48,32,0.55)" }}>No orders this session.</p>
          </div>
        )}

        {state.phase === "ready" && state.orders.length > 0 && (
          <div
            className="overflow-hidden rounded-2xl"
            style={{ background: "#FDFAF5", border: "1px solid rgba(92,48,32,0.10)", boxShadow: "0 2px 16px rgba(13,5,2,0.06)" }}
          >
            <table className="w-full text-sm">
              <thead style={{ borderBottom: "1px solid rgba(92,48,32,0.10)", background: "#F5F0EB" }}>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: "#9B6B55" }}>Order</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: "#9B6B55" }}>Time</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: "#9B6B55" }}>Items</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider" style={{ color: "#9B6B55" }}>Total</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider" style={{ color: "#9B6B55" }}>Payment</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider" style={{ color: "#9B6B55" }}>Kitchen</th>
                </tr>
              </thead>
              <tbody>
                {state.orders.map((order, i) => (
                  <tr
                    key={order.id}
                    style={{
                      borderTop: i === 0 ? undefined : "1px solid rgba(92,48,32,0.07)",
                    }}
                  >
                    <td className="px-4 py-3">
                      <span className="font-bold" style={{ fontFamily: "var(--cafe-font-display)", color: "#1A0A04" }}>
                        #{order.number}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: "#9B6B55" }}>
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3" style={{ color: "#5C3020" }}>
                      {order.items.map((it) => `${it.qty}× ${it.name}`).join(", ")}
                    </td>
                    <td className="px-4 py-3 text-right font-bold" style={{ fontFamily: "var(--cafe-font-display)", color: "#1A0A04" }}>
                      ₹{parseFloat(order.total).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className="inline-block rounded-full px-2.5 py-0.5 text-xs font-bold"
                        style={PAYMENT_STYLE[order.status] ?? fallbackStyle}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className="inline-block rounded-full px-2.5 py-0.5 text-xs font-bold"
                        style={KITCHEN_STYLE[order.kitchenStatus] ?? fallbackStyle}
                      >
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
