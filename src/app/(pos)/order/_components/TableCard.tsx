"use client";

interface TableCardProps {
  number: number;
  seats: number;
  status: "available" | "active";
  onClick: () => void;
}

export function TableCard({ number, seats, status, onClick }: TableCardProps) {
  const isActive = status === "active";

  return (
    <button
      onClick={onClick}
      className="flex cursor-pointer flex-col items-center justify-center rounded-xl p-4 text-center transition-all active:scale-95"
      style={{
        background: isActive ? "rgba(255,188,13,0.06)" : "#fff",
        border: `1.5px solid ${isActive ? "rgba(255,188,13,0.50)" : "rgba(92,48,32,0.12)"}`,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = isActive ? "#FFBC0D" : "rgba(255,188,13,0.45)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = isActive ? "rgba(255,188,13,0.50)" : "rgba(92,48,32,0.12)";
      }}
    >
      <span
        className="text-2xl font-extrabold"
        style={{ fontFamily: "var(--cafe-font-display)", color: "#1A0A04" }}
      >
        {number}
      </span>
      <span className="mt-0.5 text-xs" style={{ color: "#9B6B55" }}>{seats} seats</span>
      <span
        className="mt-2 rounded-full px-2 py-0.5 text-xs font-bold"
        style={
          isActive
            ? { background: "rgba(255,188,13,0.14)", color: "#B08000" }
            : { background: "rgba(22,128,60,0.10)", color: "#16803C" }
        }
      >
        {isActive ? "Occupied" : "Free"}
      </span>
    </button>
  );
}
