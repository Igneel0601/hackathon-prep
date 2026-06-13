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
      data-testid="table-card"
      onClick={onClick}
      className={[
        "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 p-4 text-center transition-colors",
        isActive
          ? "border-orange-400 bg-orange-50 text-orange-700 hover:bg-orange-100"
          : "border-gray-200 bg-white text-gray-800 hover:border-blue-400 hover:bg-blue-50",
      ].join(" ")}
    >
      <span className="text-2xl font-bold">{number}</span>
      <span className="mt-1 text-xs text-gray-500">{seats} seats</span>
      <span
        className={[
          "mt-2 rounded-full px-2 py-0.5 text-xs font-medium",
          isActive
            ? "bg-orange-200 text-orange-800"
            : "bg-green-100 text-green-800",
        ].join(" ")}
      >
        {isActive ? "Occupied" : "Free"}
      </span>
    </button>
  );
}
