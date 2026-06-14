"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { CafeLogo } from "@/components/CafeLogo";

type IconName =
  | "dashboard" | "products" | "categories" | "tables"
  | "payment" | "coupons" | "users" | "reports" | "kds";

function Icon({ name }: { name: IconName }) {
  const common = { width: 17, height: 17, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "dashboard": return <svg {...common}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
    case "products": return <svg {...common}><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>;
    case "categories": return <svg {...common}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
    case "tables": return <svg {...common}><path d="M3 10h18"/><path d="M5 6h14a2 2 0 0 1 2 2v2H3V8a2 2 0 0 1 2-2Z"/><path d="M4 10v8"/><path d="M20 10v8"/><path d="M8 10v4"/><path d="M16 10v4"/></svg>;
    case "payment": return <svg {...common}><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>;
    case "coupons": return <svg {...common}><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>;
    case "users": return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case "reports": return <svg {...common}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
    case "kds": return <svg {...common}><path d="M3 11h18"/><path d="M12 3v8"/><path d="M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8"/><path d="M8 7V3"/><path d="M16 7V3"/></svg>;
  }
}

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  badge?: number;
}

interface AdminNavProps {
  user: { name: string; role: string };
  badges: { products: number; tables: number };
}

export function AdminNav({ user, badges }: AdminNavProps) {
  const pathname = usePathname();

  const sections: { label: string; items: NavItem[] }[] = [
    {
      label: "Main",
      items: [{ href: "/admin", label: "Dashboard", icon: "dashboard" }],
    },
    {
      label: "Configure",
      items: [
        { href: "/admin/products", label: "Products", icon: "products", badge: badges.products || undefined },
        { href: "/admin/categories", label: "Categories", icon: "categories" },
        { href: "/admin/booking", label: "Floors & Tables", icon: "tables", badge: badges.tables || undefined },
        { href: "/admin/payment-methods", label: "Payment Methods", icon: "payment" },
        { href: "/admin/coupons", label: "Coupons & Promos", icon: "coupons" },
        { href: "/admin/users", label: "Users", icon: "users" },
      ],
    },
    {
      label: "Tools",
      items: [
        { href: "/admin/reports", label: "Reports", icon: "reports" },
        { href: "/kds", label: "Kitchen Display", icon: "kds" },
      ],
    },
  ];

  const initial = (user.name?.trim()?.[0] ?? "A").toUpperCase();

  return (
    <nav
      className="flex w-60 shrink-0 flex-col"
      style={{ background: "#1A0A04", borderRight: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4" style={{ height: 64, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <CafeLogo size={34} className="rounded-full" />
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold uppercase tracking-tight" style={{ fontFamily: "var(--font-display)", color: "#FAF3E8" }}>
            Odoo <span style={{ color: "#FFBC0D" }}>Cafe</span>
          </p>
          <p className="text-[0.625rem] font-semibold uppercase tracking-[0.14em]" style={{ color: "rgba(212,169,122,0.65)" }}>
            POS Admin
          </p>
        </div>
      </div>

      {/* Nav sections */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3">
        {sections.map((section) => (
          <div key={section.label} className="mb-4">
            <p className="px-2.5 pb-1.5 text-[0.625rem] font-bold uppercase tracking-[0.16em]" style={{ color: "rgba(212,169,122,0.45)" }}>
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="relative flex items-center gap-2.5 rounded-lg py-2 pl-3 pr-2.5 text-[0.8125rem] transition-colors"
                      style={{
                        background: active ? "rgba(255,188,13,0.12)" : "transparent",
                        color: active ? "#FFBC0D" : "rgba(250,243,232,0.72)",
                        fontWeight: active ? 700 : 500,
                      }}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-5 -translate-y-1/2 rounded-r" style={{ width: 3, background: "#FFBC0D" }} />
                      )}
                      <Icon name={item.icon} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge != null && (
                        <span
                          className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[0.625rem] font-bold"
                          style={{ background: "rgba(255,188,13,0.16)", color: "#FFBC0D" }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Footer user */}
      <div className="flex items-center gap-2.5 px-3 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
          style={{ background: "#2A1008", border: "1.5px solid rgba(255,188,13,0.30)", color: "#FFBC0D" }}
        >
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold" style={{ color: "#FAF3E8" }}>{user.name}</p>
          <p className="truncate text-[0.625rem]" style={{ color: "rgba(212,169,122,0.60)" }}>{user.role}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          aria-label="Log out"
          className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
          style={{ color: "rgba(250,243,232,0.55)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </nav>
  );
}
