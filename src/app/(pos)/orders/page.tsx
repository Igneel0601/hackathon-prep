"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOrders } from "./_hooks/useOrders";
import { PosUserMenu } from "@/components/PosUserMenu";

const PAYMENT_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  DRAFT:     { bg: "rgba(255,188,13,0.10)", color: "#8B5E00",  border: "rgba(255,188,13,0.30)" },
  PAID:      { bg: "rgba(92,48,32,0.08)",  color: "#5C3020",  border: "rgba(92,48,32,0.22)" },
  CANCELLED: { bg: "rgba(122,46,18,0.08)",  color: "#7A2E12",  border: "rgba(122,46,18,0.22)" },
};

const KITCHEN_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  NONE:      { bg: "rgba(155,107,85,0.08)", color: "#9B6B55",  border: "rgba(155,107,85,0.20)" },
  TO_COOK:   { bg: "rgba(255,188,13,0.10)", color: "#8B5E00",  border: "rgba(255,188,13,0.28)" },
  PREPARING: { bg: "rgba(92,48,32,0.10)", color: "#5C3020",  border: "rgba(92,48,32,0.22)" },
  COMPLETED: { bg: "rgba(92,48,32,0.08)",  color: "#5C3020",  border: "rgba(92,48,32,0.22)" },
};

const fallbackStyle = { bg: "rgba(155,107,85,0.08)", color: "#9B6B55", border: "rgba(155,107,85,0.20)" };

type FilterKey = "All" | "DRAFT" | "PAID" | "Kitchen" | "COMPLETED";
const FILTERS: FilterKey[] = ["All", "DRAFT", "PAID", "Kitchen", "COMPLETED"];
const FILTER_LABELS: Record<FilterKey, string> = {
  All: "All",
  DRAFT: "Draft",
  PAID: "Paid",
  Kitchen: "In Kitchen",
  COMPLETED: "Completed",
};

export default function OrdersPage() {
  const router = useRouter();
  const { refetch, ...state } = useOrders();
  const [filter, setFilter] = useState<FilterKey>("All");
  const [search, setSearch] = useState("");

  const orders = state.phase === "ready" ? state.orders : [];

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch = q === "" || `#${o.number}`.includes(q) || o.items.some((i) => i.name.toLowerCase().includes(q));
    const matchFilter =
      filter === "All" ? true :
      filter === "Kitchen" ? (o.kitchenStatus === "TO_COOK" || o.kitchenStatus === "PREPARING") :
      filter === "COMPLETED" ? o.kitchenStatus === "COMPLETED" :
      o.status === filter;
    return matchSearch && matchFilter;
  });

  // Stats
  const totalOrders = orders.length;
  const revenue = orders.filter((o) => o.status === "PAID").reduce((sum, o) => sum + parseFloat(o.total), 0);
  const paidCount = orders.filter((o) => o.status === "PAID").length;
  const kitchenActive = orders.filter((o) => o.kitchenStatus === "TO_COOK" || o.kitchenStatus === "PREPARING").length;

  return (
    <div style={{ minHeight: "100vh", background: "#F5F0EB" }}>
      {/* Header */}
      <header
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 56, background: "#FDFAF5", borderBottom: "1px solid rgba(92,48,32,0.10)" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => router.push("/tables")}
            style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: "0.8125rem", color: "#9B6B55", padding: "6px 0" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"/><path d="M12 5l-7 7 7 7"/>
            </svg>
            Home
          </button>
          <div style={{ width: 1, height: 16, background: "rgba(92,48,32,0.20)" }} />
          <h1 style={{ fontFamily: "var(--font-body)", fontSize: "1.0625rem", fontWeight: 700, color: "#1A0A04" }}>
            Session Orders
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => router.push("/kds")}
            className="hidden sm:block"
            style={{ height: 32, padding: "0 14px", background: "#fff", border: "1.5px solid rgba(92,48,32,0.16)", borderRadius: 8, fontFamily: "var(--font-body)", fontSize: "0.75rem", fontWeight: 600, color: "#5C3020", cursor: "pointer" }}
          >
            Kitchen
          </button>
          <button
            onClick={refetch}
            style={{ display: "flex", alignItems: "center", gap: 6, height: 32, padding: "0 14px", background: "#fff", border: "1.5px solid rgba(92,48,32,0.16)", borderRadius: 8, fontFamily: "var(--font-body)", fontSize: "0.75rem", fontWeight: 600, color: "#5C3020", cursor: "pointer" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>
            </svg>
            Refresh
          </button>
          <PosUserMenu />
        </div>
      </header>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "20px 20px 40px" }}>
        {/* Stats cards */}
        {state.phase === "ready" && orders.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
            {/* Total */}
            <div style={{ background: "#FDFAF5", borderRadius: 14, padding: "14px 16px", border: "1px solid rgba(92,48,32,0.10)", boxShadow: "0 1px 8px rgba(13,5,2,0.04)" }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.6875rem", fontWeight: 600, color: "#9B6B55", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>Total Orders</p>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 800, color: "#1A0A04", letterSpacing: "-0.02em", lineHeight: 1 }}>{totalOrders}</p>
            </div>
            {/* Revenue */}
            <div style={{ background: "#FDFAF5", borderRadius: 14, padding: "14px 16px", border: "1px solid rgba(92,48,32,0.10)", boxShadow: "0 1px 8px rgba(13,5,2,0.04)" }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.6875rem", fontWeight: 600, color: "#9B6B55", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>Revenue</p>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 800, color: "#FFBC0D", letterSpacing: "-0.02em", lineHeight: 1 }}>₹{revenue.toFixed(0)}</p>
            </div>
            {/* Paid */}
            <div style={{ background: "#FDFAF5", borderRadius: 14, padding: "14px 16px", border: "1px solid rgba(92,48,32,0.10)", boxShadow: "0 1px 8px rgba(13,5,2,0.04)" }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.6875rem", fontWeight: 600, color: "#9B6B55", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>Paid</p>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 800, color: "#5C3020", letterSpacing: "-0.02em", lineHeight: 1 }}>{paidCount}</p>
            </div>
            {/* Kitchen Active */}
            <div style={{ background: "#FDFAF5", borderRadius: 14, padding: "14px 16px", border: "1px solid rgba(92,48,32,0.10)", boxShadow: "0 1px 8px rgba(13,5,2,0.04)" }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.6875rem", fontWeight: 600, color: "#9B6B55", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>Kitchen Active</p>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 800, color: "#7A2E12", letterSpacing: "-0.02em", lineHeight: 1 }}>{kitchenActive}</p>
            </div>
          </div>
        )}

        {/* Search + filter pills */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <svg style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#9B6B55", pointerEvents: "none" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search orders…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", height: 40, padding: "0 14px 0 40px", fontFamily: "var(--font-body)", fontSize: "0.875rem", color: "#1A0A04", background: "#fff", border: "1.5px solid rgba(92,48,32,0.14)", borderRadius: 10, outline: "none" }}
            />
          </div>

          {/* Filter pills */}
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  height: 32,
                  padding: "0 16px",
                  borderRadius: 9999,
                  border: `1.5px solid ${filter === f ? "#1A0A04" : "rgba(92,48,32,0.18)"}`,
                  background: filter === f ? "#1A0A04" : "transparent",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.8125rem",
                  fontWeight: filter === f ? 600 : 500,
                  color: filter === f ? "#FAF3E8" : "#5C3020",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {FILTER_LABELS[f]}
              </button>
            ))}
          </div>
        </div>

        {state.phase === "loading" && (
          <p style={{ marginTop: 96, textAlign: "center", fontSize: "0.875rem", color: "rgba(92,48,32,0.40)" }}>Loading orders…</p>
        )}

        {state.phase === "error" && (
          <div style={{ borderRadius: 12, padding: "12px 16px", fontSize: "0.875rem", background: "rgba(122,46,18,0.08)", border: "1px solid rgba(122,46,18,0.18)", color: "#7A2E12" }}>
            {state.message} —{" "}
            <button onClick={refetch} style={{ textDecoration: "underline", background: "none", border: "none", cursor: "pointer", color: "inherit" }}>retry</button>
          </div>
        )}

        {state.phase === "ready" && orders.length === 0 && (
          <div style={{ marginTop: 96, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, color: "rgba(92,48,32,0.40)" }}>
            <span style={{ fontSize: "3rem" }}>📋</span>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 600, color: "rgba(92,48,32,0.55)" }}>No orders this session.</p>
          </div>
        )}

        {state.phase === "ready" && orders.length > 0 && filtered.length === 0 && (
          <p style={{ textAlign: "center", marginTop: 48, fontSize: "0.875rem", color: "rgba(92,48,32,0.45)" }}>
            No orders match your filter.
          </p>
        )}

        {state.phase === "ready" && filtered.length > 0 && (
          <div style={{ overflow: "hidden", borderRadius: 16, background: "#FDFAF5", border: "1px solid rgba(92,48,32,0.10)", boxShadow: "0 2px 16px rgba(13,5,2,0.06)" }}>
            <table style={{ width: "100%", fontSize: "0.875rem", borderCollapse: "collapse" }}>
              <thead style={{ borderBottom: "1px solid rgba(92,48,32,0.10)", background: "#F5F0EB" }}>
                <tr>
                  {["Order", "Time", "Items", "Total", "Payment", "Kitchen"].map((h, i) => (
                    <th
                      key={h}
                      style={{ padding: "10px 14px", textAlign: i >= 3 ? (i === 3 ? "right" : "center") : "left", fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9B6B55", whiteSpace: "nowrap" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((order, i) => (
                  <tr key={order.id} style={{ borderTop: i === 0 ? undefined : "1px solid rgba(92,48,32,0.07)" }}>
                    <td style={{ padding: "11px 14px" }}>
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "0.9375rem", color: "#1A0A04" }}>
                        #{order.number}
                      </span>
                    </td>
                    <td style={{ padding: "11px 14px", color: "#9B6B55", fontSize: "0.8125rem" }}>
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td style={{ padding: "11px 14px", color: "#5C3020", fontSize: "0.8125rem", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {order.items.map((it) => `${it.qty}× ${it.name}`).join(", ")}
                    </td>
                    <td style={{ padding: "11px 14px", textAlign: "right", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "0.9375rem", color: "#1A0A04" }}>
                      ₹{parseFloat(order.total).toFixed(2)}
                    </td>
                    <td style={{ padding: "11px 14px", textAlign: "center" }}>
                      {(() => {
                        const s = PAYMENT_STYLE[order.status] ?? fallbackStyle;
                        return (
                          <span style={{ display: "inline-block", borderRadius: 9999, padding: "2px 10px", fontSize: "0.6875rem", fontWeight: 700, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                            {order.status}
                          </span>
                        );
                      })()}
                    </td>
                    <td style={{ padding: "11px 14px", textAlign: "center" }}>
                      {(() => {
                        const s = KITCHEN_STYLE[order.kitchenStatus] ?? fallbackStyle;
                        return (
                          <span style={{ display: "inline-block", borderRadius: 9999, padding: "2px 10px", fontSize: "0.6875rem", fontWeight: 700, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                            {order.kitchenStatus}
                          </span>
                        );
                      })()}
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
