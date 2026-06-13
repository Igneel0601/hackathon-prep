"use client";

// Shared POS account menu: avatar button → dropdown with the signed-in user,
// quick navigation across the POS surfaces, and sign-out. Used on the POS home,
// order screen, and KDS so every surface has a nav + a way to log out.
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const LINKS: { label: string; href: string; adminOnly?: boolean }[] = [
  { label: "New Order", href: "/" },
  { label: "Orders", href: "/orders" },
  { label: "Kitchen Display", href: "/kds" },
  { label: "Admin", href: "/admin", adminOnly: true },
];

export function PosUserMenu() {
  const router = useRouter();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const name = session?.user?.name ?? session?.user?.email ?? "User";
  const role = session?.user?.role ?? "EMPLOYEE";
  const initial = name.charAt(0).toUpperCase();
  const isAdmin = role === "ADMIN";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
        style={{ background: "#2A1008", border: "1.5px solid rgba(255,188,13,0.30)", color: "#FFBC0D", cursor: "pointer", flexShrink: 0 }}
      >
        {initial}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl"
          style={{ background: "#FFFFFF", border: "1px solid rgba(92,48,32,0.14)", boxShadow: "0 18px 44px rgba(13,5,2,0.28)", zIndex: 60 }}
        >
          {/* User header */}
          <div className="flex items-center gap-2.5 px-4 py-3" style={{ borderBottom: "1px solid rgba(92,48,32,0.10)" }}>
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
              style={{ background: "#2A1008", color: "#FFBC0D" }}
            >
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold" style={{ color: "#1A0A04" }}>{name}</p>
              <p className="truncate text-xs" style={{ color: "#9B6B55" }}>{role}</p>
            </div>
          </div>

          {/* Links */}
          <div className="py-1">
            {LINKS.filter((l) => !l.adminOnly || isAdmin).map((l) => (
              <button
                key={l.href}
                onClick={() => { setOpen(false); router.push(l.href); }}
                className="flex w-full items-center px-4 py-2 text-left text-sm transition-colors hover:bg-[#F5F0EB]"
                style={{ color: "#2A1008" }}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Sign out */}
          <div style={{ borderTop: "1px solid rgba(92,48,32,0.10)" }}>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold transition-colors hover:bg-[rgba(196,26,26,0.06)]"
              style={{ color: "#C41A1A" }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
