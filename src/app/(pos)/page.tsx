"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FloorPickerModal } from "./order/_components/FloorPickerModal";
import { useTables } from "./order/_hooks/useTables";
import { CAFE_IMAGERY } from "@/lib/product-image";
import type { TableInfo } from "@/lib/api-types";

export default function PosHomePage() {
  const router = useRouter();
  const { floors, loading, error, refetch } = useTables();
  const [showPicker, setShowPicker] = useState(false);

  function handleSelectTable(table: TableInfo) {
    router.push(`/order?tableId=${table.id}`);
  }

  const tableCount = floors.reduce((n, f) => n + f.tables.length, 0);
  const freeCount = floors.reduce(
    (n, f) => n + f.tables.filter((t) => !t.hasActiveOrder).length,
    0,
  );

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      {/* Ambient hero image */}
      <Image
        src={CAFE_IMAGERY.interior}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-[0.18]"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-cream/40 via-background/80 to-background" />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">☕</span>
          <span className="font-heading text-xl font-bold text-espresso">Odoo Cafe</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/orders")}
            className="rounded-full border border-border bg-card/80 px-4 py-2 text-sm font-medium text-foreground backdrop-blur transition-colors hover:bg-secondary"
          >
            📋 Orders
          </button>
          <button
            onClick={() => router.push("/kds")}
            className="rounded-full border border-border bg-card/80 px-4 py-2 text-sm font-medium text-foreground backdrop-blur transition-colors hover:bg-secondary"
          >
            🍳 Kitchen
          </button>
        </div>
      </header>

      {/* Hero content */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="animate-rise">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-caramel">
            Point of Sale
          </p>
          <h1 className="font-heading mt-3 text-5xl font-bold text-espresso sm:text-6xl">
            Let&apos;s start an order
          </h1>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            Pick a table to open a tab. Add items, send to the kitchen, and take
            payment — all from one calm screen.
          </p>

          {error && (
            <p className="mx-auto mt-6 w-fit rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {error} —{" "}
              <button onClick={refetch} className="font-semibold underline">
                retry
              </button>
            </p>
          )}

          <button
            onClick={() => setShowPicker(true)}
            disabled={loading}
            className="mt-9 inline-flex items-center gap-2 rounded-2xl bg-primary px-10 py-4 text-lg font-semibold text-primary-foreground shadow-lg shadow-espresso/20 transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 disabled:opacity-50"
          >
            {loading ? "Loading tables…" : "Open Table"}
          </button>

          {!loading && tableCount > 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{freeCount}</span> of{" "}
              {tableCount} tables free
            </p>
          )}
        </div>
      </main>

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
