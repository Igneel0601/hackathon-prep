"use client";

interface CartLineProps {
  name: string;
  qty: number;
  unitPrice: string;
  lineTotal: string;
  onInc: () => void;
  onDec: () => void;
}

export function CartLine({ name, qty, unitPrice, lineTotal, onInc, onDec }: CartLineProps) {
  return (
    <div className="flex items-center gap-2 py-2.5" style={{ borderBottom: "1px solid rgba(92,48,32,0.07)" }}>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold" style={{ color: "#1A0A04" }}>{name}</p>
        <p className="text-xs" style={{ color: "#9B6B55" }}>₹{parseFloat(unitPrice).toFixed(0)} each</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onDec}
          className="flex h-6 w-6 items-center justify-center rounded-full text-base transition-colors"
          style={{ border: "1.5px solid rgba(92,48,32,0.22)", background: "#fff", color: "#2A1008" }}
        >
          −
        </button>
        <span className="w-5 text-center text-sm font-bold" style={{ color: "#1A0A04" }}>{qty}</span>
        <button
          onClick={onInc}
          className="flex h-6 w-6 items-center justify-center rounded-full text-base transition-colors"
          style={{ border: "1.5px solid rgba(92,48,32,0.22)", background: "#fff", color: "#2A1008" }}
        >
          +
        </button>
      </div>
      <span className="shrink-0 text-sm font-bold" style={{ fontFamily: "var(--cafe-font-display)", color: "#1A0A04" }}>
        ₹{parseFloat(lineTotal).toFixed(0)}
      </span>
    </div>
  );
}
