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
        "group flex cursor-pointer flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all hover:-translate-y-0.5 hover:shadow-md",
        isActive
          ? "border-caramel/50 bg-accent/25 text-espresso hover:bg-accent/40"
          : "border-border bg-card text-foreground hover:border-primary/40",
      ].join(" ")}
    >
      <span className="font-heading text-3xl font-bold">{number}</span>
      <span className="mt-1 text-xs text-muted-foreground">{seats} seats</span>
      <span
        className={[
          "mt-2 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
          isActive
            ? "bg-caramel/30 text-espresso"
            : "bg-primary/10 text-primary",
        ].join(" ")}
      >
        {isActive ? "Occupied" : "Free"}
      </span>
    </button>
  );
}
