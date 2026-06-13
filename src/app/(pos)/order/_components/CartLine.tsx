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
    <div className="flex items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">₹{parseFloat(unitPrice).toFixed(0)} each</p>
      </div>
      <div className="flex items-center gap-1 rounded-full bg-secondary p-0.5">
        <button
          onClick={onDec}
          aria-label="Decrease quantity"
          className="flex h-7 w-7 items-center justify-center rounded-full text-base text-secondary-foreground transition-colors hover:bg-card"
        >
          −
        </button>
        <span className="w-6 text-center text-sm font-bold text-foreground">{qty}</span>
        <button
          onClick={onInc}
          aria-label="Increase quantity"
          className="flex h-7 w-7 items-center justify-center rounded-full text-base text-secondary-foreground transition-colors hover:bg-card"
        >
          +
        </button>
      </div>
      <span className="w-16 text-right text-sm font-bold text-foreground">
        ₹{parseFloat(lineTotal).toFixed(0)}
      </span>
    </div>
  );
}
