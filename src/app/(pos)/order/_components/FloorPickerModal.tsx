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
        flexDirection: "column",
        // Coffee-bean background + dark overlay (matches landing).
        backgroundImage:
          "radial-gradient(ellipse 80% 70% at 50% 40%, rgba(13,5,2,0.78) 0%, rgba(13,5,2,0.90) 100%), url('/coffee-beans.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Header */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 24px 18px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.6875rem",
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "rgba(255,188,13,0.85)",
              marginBottom: 2,
            }}
          >
            Odoo Cafe
          </p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "2rem",
              fontWeight: 800,
              letterSpacing: "-0.01em",
              textTransform: "uppercase",
              color: "#FAF3E8",
              lineHeight: 1,
            }}
          >
            Select Table
          </h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            border: "1.5px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.06)",
            cursor: "pointer",
            color: "#FAF3E8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18"/><path d="M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "22px 24px 28px",
          display: "flex",
          flexDirection: "column",
          gap: 26,
          maxWidth: 1100,
          width: "100%",
          margin: "0 auto",
        }}
      >
        {floors.length === 0 && (
          <p style={{ textAlign: "center", fontSize: "0.875rem", color: "rgba(250,243,232,0.55)" }}>
            No floors found.
          </p>
        )}

        {floors.map((floor) => {
          const occ = floor.tables.filter((t) => t.hasActiveOrder).length;
          return (
            <div key={floor.id} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "rgba(250,243,232,0.85)",
                  }}
                >
                  {floor.name}
                </p>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "0.6875rem", color: "rgba(212,169,122,0.70)" }}>
                  {occ}/{floor.tables.length} occupied
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(104px, 1fr))",
                  gap: 12,
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
          );
        })}
      </div>

      {/* Footer CTA — shown when table selected */}
      {selectedTable && (
        <div
          style={{
            flexShrink: 0,
            padding: "16px 24px",
            borderTop: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(13,5,2,0.78)",
            backdropFilter: "blur(12px)",
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
                color: "rgba(212,169,122,0.80)",
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
                color: "#FAF3E8",
              }}
            >
              Table {selectedTable.number} · {selectedTable.seats} seats
            </span>
          </div>
          <button
            onClick={handleConfirm}
            style={{
              height: 48,
              padding: "0 30px",
              background: "#FFBC0D",
              color: "#1A0A04",
              border: "none",
              borderRadius: 12,
              fontFamily: "var(--font-body)",
              fontSize: "0.9375rem",
              fontWeight: 700,
              letterSpacing: "0.01em",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 6px 20px rgba(255,188,13,0.42)",
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

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
}
