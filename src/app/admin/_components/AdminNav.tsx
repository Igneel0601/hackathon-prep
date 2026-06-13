"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/products", label: "Products", icon: "☕" },
  { href: "/admin/categories", label: "Categories", icon: "🏷️" },
  { href: "/admin/booking", label: "Floors & Tables", icon: "🪑" },
  { href: "/admin/payment-methods", label: "Payment Methods", icon: "💳" },
  { href: "/admin/coupons", label: "Coupons & Promos", icon: "🎟️" },
  { href: "/admin/users", label: "Users", icon: "👥" },
  { href: "/admin/reports", label: "Reports", icon: "📈" },
  { href: "/kds", label: "Kitchen Display", icon: "🍳" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex w-56 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-4 py-4">
        <p className="text-lg font-bold text-gray-900">Cafe POS</p>
        <p className="text-xs text-gray-400">Admin</p>
      </div>
      <ul className="flex-1 space-y-1 p-2">
        {LINKS.map((l) => {
          const active = l.href === "/admin" ? pathname === l.href : pathname.startsWith(l.href);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  active ? "bg-blue-50 font-medium text-blue-700" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span>{l.icon}</span>
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-gray-100 p-2">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          <span>🚪</span> Log out
        </button>
      </div>
    </nav>
  );
}
