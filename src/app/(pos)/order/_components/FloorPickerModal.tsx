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
      className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/55 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Select a Table"
        className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-border/60 bg-card p-7 shadow-2xl shadow-espresso/30 animate-rise"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-5 top-5 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          ×
        </button>

        <p className="text-xs font-medium uppercase tracking-[0.2em] text-caramel">
          Floor plan
        </p>
        <h2 className="font-heading mt-1 mb-6 text-2xl font-bold text-espresso">
          Select a Table
        </h2>

        {floors.length === 0 && (
          <p className="text-center text-muted-foreground">No floors found.</p>
        )}

        {floors.map((floor) => (
          <div key={floor.id} className="mb-7 last:mb-0">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {floor.name}
            </h3>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
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
