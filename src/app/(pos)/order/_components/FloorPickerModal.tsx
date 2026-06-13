"use client";

import type { Floor, TableInfo } from "@/lib/api-types";
import { TableCard } from "./TableCard";

interface FloorPickerModalProps {
  floors: Floor[];
  onSelectTable: (table: TableInfo) => void;
  onClose: () => void;
}

export function FloorPickerModal({ floors, onSelectTable, onClose }: FloorPickerModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ background: "rgba(13,5,2,0.65)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl overflow-y-auto rounded-t-3xl p-6 sm:rounded-3xl"
        style={{
          maxHeight: "88vh",
          background: "#FDFAF5",
          boxShadow: "0 -16px 60px rgba(13,5,2,0.40)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle (mobile) */}
        <div className="mb-4 flex justify-center sm:hidden">
          <div className="h-1 w-9 rounded-full" style={{ background: "rgba(92,48,32,0.22)" }} />
        </div>

        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2
            className="text-xl font-extrabold uppercase tracking-tight"
            style={{ fontFamily: "var(--cafe-font-display)", color: "#1A0A04" }}
          >
            Select a Table
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-lg transition-colors"
            style={{ background: "rgba(92,48,32,0.08)", color: "#5C3020" }}
          >
            ×
          </button>
        </div>

        {floors.length === 0 && (
          <p className="text-center text-sm" style={{ color: "rgba(92,48,32,0.50)" }}>No floors found.</p>
        )}

        {floors.map((floor) => (
          <div key={floor.id} className="mb-6 last:mb-0">
            <p
              className="mb-3 text-xs font-bold uppercase tracking-widest"
              style={{ color: "#9B6B55" }}
            >
              {floor.name}
            </p>
            <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6">
              {floor.tables.map((table) => (
                <TableCard
                  key={table.id}
                  number={table.number}
                  seats={table.seats}
                  status={table.hasActiveOrder ? "active" : "available"}
                  onClick={() => onSelectTable(table)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
