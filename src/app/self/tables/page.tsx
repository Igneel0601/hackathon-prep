"use client";

import { useEffect, useReducer } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getSelfTables } from "@/lib/api-client";
import type { Floor } from "@/lib/api-types";
import { TableCard } from "../../(pos)/order/_components/TableCard";

const DISPLAY = "var(--cafe-font-display)";
const BODY = "var(--cafe-font-body)";

type State =
  | { phase: "loading" }
  | { phase: "ready"; floors: Floor[] }
  | { phase: "error"; message: string };
type Action = { type: "ready"; floors: Floor[] } | { type: "error"; message: string };

function reducer(_: State, a: Action): State {
  return a.type === "ready" ? { phase: "ready", floors: a.floors } : { phase: "error", message: a.message };
}

export default function SelfTablesPage() {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, { phase: "loading" });

  useEffect(() => {
    let cancelled = false;
    getSelfTables()
      .then((d) => { if (!cancelled) dispatch({ type: "ready", floors: d.floors }); })
      .catch((e: unknown) => { if (!cancelled) dispatch({ type: "error", message: e instanceof Error ? e.message : "Failed to load tables" }); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden" style={{ fontFamily: BODY }}>
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image src="/coffee-beans.jpg" alt="" fill className="object-cover object-center" priority />
      </div>
      <div className="absolute inset-0 z-[1]" style={{ background: "radial-gradient(ellipse 80% 70% at 50% 40%, rgba(13,5,2,0.80) 0%, rgba(13,5,2,0.92) 100%)" }} />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5">
        <button onClick={() => router.push("/welcome")} className="flex items-center gap-1.5 text-sm" style={{ color: "rgba(250,243,232,0.7)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 5l-7 7 7 7"/></svg>
          Back
        </button>
        <span className="flex items-center gap-2 text-xs" style={{ color: "rgba(250,243,232,0.6)" }}>
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "#9B6B55" }} /> Free
          <span className="ml-3 inline-block h-2.5 w-2.5 rounded-full" style={{ background: "#FFBC0D" }} /> Occupied
        </span>
      </header>

      {/* Body */}
      <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 overflow-y-auto px-6 pb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: "rgba(255,188,13,0.85)" }}>Self Checkout</p>
        <h1 className="mb-6 text-4xl uppercase tracking-tight" style={{ fontFamily: DISPLAY, color: "#FAF3E8" }}>Select Your Table</h1>

        {state.phase === "loading" && <p className="mt-16 text-center text-sm" style={{ color: "rgba(250,243,232,0.55)" }}>Loading tables…</p>}
        {state.phase === "error" && <p className="mt-16 text-center text-sm" style={{ color: "#C99A86" }}>{state.message}</p>}

        {state.phase === "ready" && state.floors.map((floor) => (
          <div key={floor.id} className="mb-7">
            <div className="mb-3 flex items-center gap-3">
              <span className="text-sm font-semibold uppercase tracking-wide" style={{ color: "#FAF3E8" }}>{floor.name}</span>
              <span className="h-px flex-1" style={{ background: "rgba(255,255,255,0.1)" }} />
            </div>
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(108px, 1fr))" }}>
              {floor.tables.filter((t) => t.active).map((table) => (
                <TableCard
                  key={table.id}
                  number={table.number}
                  seats={table.seats}
                  status={table.hasActiveOrder ? "occupied" : "free"}
                  onClick={table.hasActiveOrder ? undefined : () => router.push(`/self/order?tableId=${table.id}&n=${table.number}`)}
                />
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
