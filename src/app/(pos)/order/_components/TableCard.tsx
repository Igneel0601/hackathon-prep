"use client";

interface TableCardProps {
  number: number;
  seats: number;
  status: "free" | "occupied";
  selected?: boolean;
  occupiedSince?: string;
  onClick?: () => void;
}

export function TableCard({ number, seats, status, selected = false, occupiedSince, onClick }: TableCardProps) {
  const isFree = status === "free";
  const isOccupied = status === "occupied";
  const isSelected = selected && isFree;

  let bg = "#fff";
  let border = "1.5px solid rgba(92,48,32,0.14)";
  let boxShadow = "none";
  let transform = "none";
  let numColor = "#2A1008";
  let statusBg = "rgba(74,222,128,0.15)";
  let statusColor = "#16803C";
  let statusLabel = "Free";
  const cursor = "pointer";

  if (isSelected) {
    bg = "rgba(255,188,13,0.12)";
    border = "2px solid #FFBC0D";
    boxShadow = "0 0 0 3px rgba(255,188,13,0.25), 0 8px 24px rgba(255,188,13,0.20)";
    transform = "translateY(-2px) scale(1.02)";
    numColor = "#B88400";
    statusBg = "rgba(255,188,13,0.30)";
    statusColor = "#7A4A00";
    statusLabel = "Selected";
  } else if (isOccupied) {
    bg = "rgba(255,188,13,0.05)";
    border = "2px solid #FFBC0D";
    numColor = "#8B0000";
    statusBg = "rgba(255,188,13,0.18)";
    statusColor = "#8B5E00";
    statusLabel = "Occupied";
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Table ${number}, ${seats} seats, ${statusLabel}`}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter") onClick?.(); }}
      style={{
        aspectRatio: "3/4",
        borderRadius: 14,
        border,
        background: bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        cursor,
        padding: "12px 8px",
        transition: "all 160ms cubic-bezier(0.34,1.56,0.64,1)",
        position: "relative",
        userSelect: "none",
        boxShadow,
        transform,
      }}
    >
      {/* Occupied time badge */}
      {isOccupied && occupiedSince && (
        <span
          style={{
            position: "absolute",
            top: 7,
            right: 7,
            fontFamily: "var(--font-body)",
            fontSize: "0.5625rem",
            fontWeight: 700,
            color: "rgba(139,0,0,0.55)",
            letterSpacing: "0.04em",
            background: "rgba(139,0,0,0.07)",
            borderRadius: 4,
            padding: "1px 4px",
          }}
        >
          {occupiedSince}
        </span>
      )}

      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "2rem",
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: "-0.02em",
          color: numColor,
        }}
      >
        {number}
      </span>
      <span style={{ fontFamily: "var(--font-body)", fontSize: "0.6875rem", color: "#9B6B55", fontWeight: 500 }}>
        {seats} seats
      </span>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          borderRadius: 9999,
          padding: "2px 9px",
          fontFamily: "var(--font-body)",
          fontSize: "0.6875rem",
          fontWeight: 700,
          letterSpacing: "0.03em",
          marginTop: 2,
          background: statusBg,
          color: statusColor,
        }}
      >
        {statusLabel}
      </span>
    </div>
  );
}
