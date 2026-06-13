"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FloorPickerModal } from "./order/_components/FloorPickerModal";
import { useTables } from "./order/_hooks/useTables";
import type { TableInfo } from "@/lib/api-types";

export default function PosHomePage() {
  const router = useRouter();
  const { floors, loading, error, refetch } = useTables();
  const [showPicker, setShowPicker] = useState(false);

  function handleSelectTable(table: TableInfo) {
    router.push(`/order?tableId=${table.id}`);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Cafe POS</h1>
        <p className="mt-2 text-gray-500">Select a table to start an order</p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
            {error} —{" "}
            <button onClick={refetch} className="underline">
              retry
            </button>
          </p>
        )}

        <button
          onClick={() => setShowPicker(true)}
          disabled={loading}
          className="mt-8 rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Loading tables…" : "Open Table"}
        </button>

        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => router.push("/orders")}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            📋 Orders
          </button>
          <button
            onClick={() => router.push("/kds")}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            🍳 Kitchen Display
          </button>
        </div>
      </div>

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
