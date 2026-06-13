"use client";

import { usePathname } from "next/navigation";

const LABELS: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/products": "Products",
  "/admin/categories": "Categories",
  "/admin/booking": "Floors & Tables",
  "/admin/payment-methods": "Payment Methods",
  "/admin/coupons": "Coupons & Promos",
  "/admin/users": "Users",
  "/admin/reports": "Reports",
};

export function AdminTopbar() {
  const pathname = usePathname();
  const key = Object.keys(LABELS)
    .filter((k) => (k === "/admin" ? pathname === k : pathname.startsWith(k)))
    .sort((a, b) => b.length - a.length)[0];
  const label = (key && LABELS[key]) || "Admin";

  return (
    <header
      className="flex shrink-0 items-center justify-between gap-3 px-6"
      style={{ height: 56, background: "#FDFAF5", borderBottom: "1px solid rgba(92,48,32,0.10)" }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[0.8125rem]" style={{ color: "#9B6B55" }}>
        <span>POS</span>
        <span style={{ color: "rgba(255,188,13,0.6)" }}>›</span>
        <span className="font-semibold" style={{ color: "#5C3020" }}>{label}</span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden sm:block">
          <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9B6B55" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Quick search…"
            className="text-[0.8125rem] outline-none"
            style={{
              width: 200,
              height: 34,
              padding: "0 12px 0 32px",
              background: "#fff",
              border: "1.5px solid rgba(92,48,32,0.14)",
              borderRadius: 9999,
              color: "#1A0A04",
            }}
          />
        </div>

        {/* Bell */}
        <button
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-full transition-colors"
          style={{ color: "#5C3020", border: "1.5px solid rgba(92,48,32,0.12)", background: "#fff" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
          </svg>
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full" style={{ background: "#FFBC0D" }} />
        </button>
      </div>
    </header>
  );
}
