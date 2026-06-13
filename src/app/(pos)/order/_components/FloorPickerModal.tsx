"use client";

import { useState } from "react";
import type { Floor, TableInfo } from "@/lib/api-types";
import { TableCard } from "./TableCard";

interface FloorPickerModalProps {
  floors: Floor[];
  onSelectTable: (table: TableInfo) => void;
  onClose: () => void;
}

export function FloorPickerModal({ floors, onSelectTable, onClose }: FloorPickerModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const allTables = floors.flatMap((f) => f.tables);
  const selectedTable = allTables.find((t) => t.id === selectedId) ?? null;

  function handleTableClick(table: TableInfo) {
    // Occupied table -> resume its existing order immediately.
    if (table.hasActiveOrder) {
      onSelectTable(table);
      return;
    }
    // Free table -> select, confirm via footer CTA.
    setSelectedId((prev) => (prev === table.id ? null : table.id));
  }

  function handleConfirm() {
    if (selectedTable) onSelectTable(selectedTable);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(13,5,2,0.70)",
        backdropFilter: "blur(4px)",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 700,
          maxHeight: "calc(100vh - 110px)",
          background: "#FDFAF5",
          borderRadius: 20,
          boxShadow: "0 32px 80px rgba(13,5,2,0.70), 0 2px 0 rgba(255,255,255,0.08) inset",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: "1px solid rgba(92,48,32,0.06)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px 16px",
            borderBottom: "1px solid rgba(92,48,32,0.08)",
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "1.375rem",
              fontWeight: 700,
              color: "#1A0A04",
              letterSpacing: "-0.01em",
            }}
          >
            Select a Table
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "#9B6B55",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18"/><path d="M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Modal body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {floors.length === 0 && (
            <p style={{ textAlign: "center", fontSize: "0.875rem", color: "rgba(92,48,32,0.50)" }}>
              No floors found.
            </p>
          )}

          {floors.map((floor) => (
            <div key={floor.id} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#9B6B55",
                }}
              >
                {floor.name}
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))",
                  gap: 10,
                }}
              >
                {floor.tables.map((table) => (
                  <TableCard
                    key={table.id}
                    number={table.number}
                    seats={table.seats}
                    status={table.hasActiveOrder ? "occupied" : "free"}
                    selected={selectedId === table.id}
                    onClick={() => handleTableClick(table)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer CTA — shown when table selected */}
        {selectedTable && (
          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid rgba(92,48,32,0.08)",
              background: "#FDFAF5",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              animation: "slideUp 0.22s ease both",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#9B6B55",
                }}
              >
                Selected
              </span>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  letterSpacing: "-0.01em",
                  color: "#1A0A04",
                }}
              >
                Table {selectedTable.number} · {selectedTable.seats} seats
              </span>
            </div>
            <button
              onClick={handleConfirm}
              style={{
                height: 46,
                padding: "0 28px",
                background: "#FFBC0D",
                color: "#1A0A04",
                border: "none",
                borderRadius: 10,
                fontFamily: "var(--font-body)",
                fontSize: "0.9375rem",
                fontWeight: 700,
                letterSpacing: "0.01em",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 4px 16px rgba(255,188,13,0.38)",
                whiteSpace: "nowrap",
              }}
            >
              Open Table
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
}
