"use client";

import type { Floor, TableInfo } from "@/lib/api-types";
import { TableCard } from "./TableCard";

interface FloorPickerModalProps {
  floors: Floor[];
  onSelectTable: (table: TableInfo, floorName: string) => void;
}

export function FloorPickerModal({ floors, onSelectTable }: FloorPickerModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="mb-6 text-xl font-bold text-gray-900">Select a Table</h2>

        {floors.length === 0 && (
          <p className="text-center text-gray-500">No floors found.</p>
        )}

        {floors.map((floor) => (
          <div key={floor.id} className="mb-6">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              {floor.name}
            </h3>
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
              {floor.tables.map((table) => (
                <TableCard
                  key={table.id}
                  number={table.number}
                  seats={table.seats}
                  status={table.hasActiveOrder ? "active" : "available"}
                  onClick={() => onSelectTable(table, floor.name)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
