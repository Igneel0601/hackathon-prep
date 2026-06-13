"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

interface UserMenuProps {
  tone?: "light" | "dark";
}

export function UserMenu({ tone = "light" }: UserMenuProps) {
  const { data } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const name = data?.user?.name?.trim() || data?.user?.email || "User";
  const initial = name[0]?.toUpperCase() ?? "U";
  const isAdmin = data?.user?.role === "ADMIN";

  const avatarStyle =
    tone === "dark"
      ? { background: "#2A1008", border: "1.5px solid rgba(255,255,255,0.16)", color: "#FAF3E8" }
      : { background: "#2A1008", border: "1.5px solid rgba(255,188,13,0.30)", color: "#FAF3E8" };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-transform active:scale-95"
        style={avatarStyle}
      >
        {initial}
      </button>

      {open && (
        <>
          {/* click-outside backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl"
            style={{
              background: "#FDFAF5",
              border: "1px solid rgba(92,48,32,0.14)",
              boxShadow: "0 16px 40px rgba(13,5,2,0.22)",
              fontFamily: "var(--cafe-font-body)",
            }}
          >
            <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(92,48,32,0.10)" }}>
              <p className="truncate text-sm font-semibold" style={{ color: "#1A0A04" }}>{name}</p>
              <p className="text-xs" style={{ color: "#9B6B55" }}>{isAdmin ? "Administrator" : "Staff"}</p>
            </div>

            <button
              onClick={() => { setOpen(false); router.push("/"); }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors hover:bg-[rgba(92,48,32,0.05)]"
              style={{ color: "#5C3020" }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>
              POS Home
            </button>

            {isAdmin && (
              <button
                onClick={() => { setOpen(false); router.push("/admin"); }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors hover:bg-[rgba(92,48,32,0.05)]"
                style={{ color: "#5C3020" }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                Admin Panel
              </button>
            )}

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-semibold transition-colors hover:bg-[rgba(122,46,18,0.06)]"
              style={{ color: "#7A2E12", borderTop: "1px solid rgba(92,48,32,0.10)" }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Log out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
