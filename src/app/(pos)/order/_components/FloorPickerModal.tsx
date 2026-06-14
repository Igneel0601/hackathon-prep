"use client";

import { useState } from "react";
import type { Floor, TableInfo } from "@/lib/api-types";
import { TableCard } from "./TableCard";

interface FloorPickerModalProps {
  floors: Floor[];
  onSelectTable: (table: TableInfo) => void;
  onClose: () => void;
}

const DISPLAY = "var(--cafe-font-display)";
const BODY = "var(--cafe-font-body)";

export function FloorPickerModal({ floors, onSelectTable, onClose }: FloorPickerModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const allTables = floors.flatMap((f) => f.tables);
  const selectedTable = allTables.find((t) => t.id === selectedId) ?? null;

  function handleTableClick(table: TableInfo) {
    if (table.hasActiveOrder) {
      onSelectTable(table);
      return;
    }
    setSelectedId((prev) => (prev === table.id ? null : table.id));
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
        padding: 20,
        fontFamily: BODY,
        backgroundImage:
          "radial-gradient(ellipse 80% 70% at 50% 40%, rgba(13,5,2,0.82) 0%, rgba(13,5,2,0.92) 100%), url('/coffee-beans.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      onClick={onClose}
    >
      {/* Frosted panel */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 880,
          maxHeight: "calc(100vh - 64px)",
          display: "flex",
          flexDirection: "column",
          borderRadius: 24,
          overflow: "hidden",
          background: "rgba(26,10,4,0.55)",
          backdropFilter: "blur(18px)",
          border: "1px solid rgba(255,188,13,0.20)",
          boxShadow: "0 40px 90px rgba(13,5,2,0.7)",
        }}
      >
        {/* Header */}
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            padding: "22px 26px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div>
            <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,188,13,0.85)", marginBottom: 4 }}>
              Odoo Cafe
            </p>
            <h2 style={{ fontFamily: DISPLAY, fontSize: "1.75rem", textTransform: "uppercase", color: "#FAF3E8", lineHeight: 1 }}>
              Select Table
            </h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Legend */}
            <div style={{ display: "flex", gap: 12 }} className="hidden sm:flex">
              <Legend color="#9B6B55" label="Free" />
              <Legend color="#FFBC0D" label="Occupied" />
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                width: 38, height: 38, borderRadius: 10,
                border: "1.5px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.06)",
                cursor: "pointer", color: "#FAF3E8",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18"/><path d="M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 26px 26px", display: "flex", flexDirection: "column", gap: 24 }}>
          {floors.length === 0 && (
            <p style={{ textAlign: "center", fontSize: "0.875rem", color: "rgba(250,243,232,0.55)" }}>No floors found.</p>
          )}

          {floors.map((floor) => {
            const occ = floor.tables.filter((t) => t.hasActiveOrder).length;
            return (
              <div key={floor.id} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#FAF3E8" }}>
                    {floor.name}
                  </span>
                  <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.10)" }} />
                  <span style={{ fontSize: "0.6875rem", color: "rgba(212,169,122,0.75)" }}>{occ}/{floor.tables.length} occupied</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(108px, 1fr))", gap: 12 }}>
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

        {/* Footer CTA */}
        {selectedTable && (
          <div
            style={{
              flexShrink: 0,
              padding: "16px 26px",
              borderTop: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(13,5,2,0.55)",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
              animation: "slideUp 0.22s ease both",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(212,169,122,0.80)" }}>
                Selected
              </span>
              <span style={{ fontFamily: DISPLAY, fontSize: "1.125rem", color: "#FAF3E8" }}>
                Table {selectedTable.number} · {selectedTable.seats} seats
              </span>
            </div>
            <button
              onClick={() => onSelectTable(selectedTable)}
              style={{
                height: 48, padding: "0 30px", background: "#FFBC0D", color: "#1A0A04",
                border: "none", borderRadius: 12, fontFamily: BODY, fontSize: "0.9375rem", fontWeight: 700,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                boxShadow: "0 6px 20px rgba(255,188,13,0.42)", whiteSpace: "nowrap",
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
        @keyframes slideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
      `}</style>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.6875rem", color: "rgba(250,243,232,0.70)" }}>
      <span style={{ width: 9, height: 9, borderRadius: "50%", background: color }} />
      {label}
    </span>
  );
}
