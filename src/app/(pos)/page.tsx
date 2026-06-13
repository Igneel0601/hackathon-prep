"use client";

import { useReducer, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FloorPickerModal } from "./order/_components/FloorPickerModal";
import { useTables } from "./order/_hooks/useTables";
import type { TableInfo } from "@/lib/api-types";

type ClockState = { clock: string; date: string };
function clockReducer(_: ClockState, now: Date): ClockState {
  return {
    clock: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    date: now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
  };
}

export default function PosHomePage() {
  const router = useRouter();
  const { floors, loading, error, refetch } = useTables();
  const [showPicker, setShowPicker] = useState(false);
  const [clockState, dispatchClock] = useReducer(clockReducer, { clock: "", date: "" });

  useEffect(() => {
    const tick = () => dispatchClock(new Date());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const allTables = floors.flatMap((f) => f.tables);
  const totalTables = allTables.length;
  const occupiedTables = allTables.filter((t) => t.hasActiveOrder).length;
  const availableTables = totalTables - occupiedTables;

  function handleSelectTable(table: TableInfo) {
    router.push(`/order?tableId=${table.id}`);
  }

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      {/* Background — coffee beans */}
      <div className="absolute inset-0 z-0">
        <Image src="/coffee-beans.jpg" alt="" fill className="object-cover object-center" priority />
      </div>
      {/* Overlay */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background: "radial-gradient(ellipse 75% 65% at 50% 50%, rgba(13,5,2,0.70) 0%, rgba(13,5,2,0.86) 100%), linear-gradient(to bottom, rgba(13,5,2,0.55) 0%, rgba(13,5,2,0.40) 45%, rgba(13,5,2,0.80) 100%)",
        }}
      />

      {/* Navbar */}
      <header
        className="relative z-10 flex shrink-0 items-center justify-between px-5 md:px-9"
        style={{ height: 64, background: "rgba(13,5,2,0.48)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <Image src="/logo-badge.png" alt="Odoo Cafe" width={32} height={32} className="object-contain" />
          <span className="hidden text-base font-extrabold uppercase tracking-tight md:block" style={{ fontFamily: "var(--cafe-font-display)", color: "#FAF3E8" }}>
            Odoo <span style={{ color: "#FFBC0D" }}>Cafe</span>
          </span>
        </div>

        {/* Clock (desktop) */}
        {clockState.clock && (
          <div className="absolute left-1/2 hidden -translate-x-1/2 flex-col items-center md:flex">
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 700, color: "#FAF3E8", letterSpacing: "-0.01em" }}>
              {clockState.clock}
            </span>
            <span style={{ fontFamily: "var(--font-body)", fontSize: "0.6875rem", color: "rgba(250,243,232,0.50)", letterSpacing: "0.02em" }}>
              {clockState.date}
            </span>
          </div>
        )}

        {/* Right: nav links + badge + avatar */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => router.push("/orders")}
            className="hidden rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors md:block"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(250,243,232,0.70)" }}
          >
            Orders
          </button>
          <button
            onClick={() => router.push("/kds")}
            className="hidden rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors md:block"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(250,243,232,0.70)" }}
          >
            Kitchen
          </button>

          {/* OPEN badge */}
          <div
            className="flex items-center gap-1.5 rounded-full py-1 pl-1.5 pr-2.5"
            style={{ background: "rgba(255,188,13,0.12)", border: "1px solid rgba(255,188,13,0.25)" }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#4ade80", boxShadow: "0 0 6px #4ade80" }} />
            <span className="text-[0.7rem] font-bold uppercase tracking-[0.05em]" style={{ color: "rgba(250,243,232,0.90)" }}>Open</span>
          </div>

          {/* Avatar */}
          <div
            className="flex items-center justify-center rounded-full text-xs font-bold"
            style={{
              width: 34,
              height: 34,
              background: "rgba(26,10,4,0.70)",
              border: "1.5px solid rgba(255,255,255,0.18)",
              color: "#FAF3E8",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            N
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-8 text-center">
        {/* Logo */}
        <div className="relative mb-6 flex justify-center">
          <div
            className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(255,188,13,0.28) 0%, transparent 70%)" }}
          />
          <Image src="/logo-badge.png" alt="Odoo Cafe" width={76} height={76} className="relative z-10 object-contain" style={{ filter: "drop-shadow(0 6px 18px rgba(255,188,13,0.35))" }} />
        </div>

        <h1
          className="text-6xl font-extrabold uppercase leading-none tracking-tight text-[#FAF3E8] md:text-8xl"
          style={{ fontFamily: "var(--cafe-font-display)", textShadow: "0 4px 30px rgba(13,5,2,0.8)" }}
        >
          Odoo <span style={{ color: "#FFBC0D" }}>Cafe</span>
        </h1>
        <div className="mx-auto my-5 h-0.5 w-16 rounded-full" style={{ background: "linear-gradient(to right, transparent, #FFBC0D, transparent)" }} />
        <p className="mb-9 text-sm uppercase tracking-[0.28em]" style={{ color: "rgba(212,169,122,0.85)" }}>
          Cozy · Warm · Freshly Brewed
        </p>

        {error && (
          <p className="mb-5 rounded-lg px-4 py-2 text-sm" style={{ background: "rgba(139,0,0,0.30)", color: "#F2A8A8" }}>
            {error} —{" "}
            <button onClick={refetch} className="underline">retry</button>
          </p>
        )}

        {/* Actions */}
        <div className="flex w-full max-w-xs flex-col gap-3">
          {/* Open Table — primary */}
          <button
            onClick={() => setShowPicker(true)}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl text-base font-bold transition-all active:scale-[0.98] disabled:opacity-50"
            style={{
              height: 54,
              background: "#FFBC0D",
              color: "#1A0A04",
              boxShadow: "0 6px 24px rgba(255,188,13,0.45), 0 1px 0 rgba(255,255,255,0.18) inset",
            }}
          >
            {loading ? "Loading tables…" : (
              <>
                Open Table
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>
                </svg>
              </>
            )}
          </button>

          {/* Orders + Kitchen — secondary, same shape */}
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/orders")}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl text-base font-bold transition-all active:scale-[0.98]"
              style={{
                height: 54,
                background: "rgba(255,188,13,0.08)",
                color: "#FFBC0D",
                border: "1.5px solid rgba(255,188,13,0.45)",
                backdropFilter: "blur(8px)",
              }}
            >
              Orders
            </button>
            <button
              onClick={() => router.push("/kds")}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl text-base font-bold transition-all active:scale-[0.98]"
              style={{
                height: 54,
                background: "rgba(255,188,13,0.08)",
                color: "#FFBC0D",
                border: "1.5px solid rgba(255,188,13,0.45)",
                backdropFilter: "blur(8px)",
              }}
            >
              Kitchen
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="relative z-10 flex shrink-0 items-center justify-center gap-5 px-5 py-2.5"
        style={{ background: "rgba(13,5,2,0.42)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        {!loading && totalTables > 0 && (
          <>
            <span className="text-xs" style={{ color: "rgba(212,169,122,0.65)" }}>
              Tables: <span className="font-semibold" style={{ color: "#FAF3E8" }}>{totalTables}</span>
            </span>
            <span style={{ color: "rgba(212,169,122,0.30)" }}>·</span>
            <span className="text-xs" style={{ color: "rgba(212,169,122,0.65)" }}>
              Available: <span className="font-semibold" style={{ color: "#4ade80" }}>{availableTables}</span>
            </span>
            <span style={{ color: "rgba(212,169,122,0.30)" }}>·</span>
            <span className="text-xs" style={{ color: "rgba(212,169,122,0.65)" }}>
              Occupied: <span className="font-semibold" style={{ color: "#FFBC0D" }}>{occupiedTables}</span>
            </span>
            <span style={{ color: "rgba(212,169,122,0.30)" }}>·</span>
          </>
        )}
        <span className="text-xs" style={{ color: "rgba(212,169,122,0.65)" }}>
          Version <span className="font-semibold" style={{ color: "#FAF3E8" }}>1.0.0</span>
        </span>
      </footer>

      {showPicker && !loading && (
        <FloorPickerModal
          floors={floors}
          onClose={() => setShowPicker(false)}
          onSelectTable={(table) => {
            setShowPicker(false);
            handleSelectTable(table);
          }}
        />
      )}
    </div>
  );
}
