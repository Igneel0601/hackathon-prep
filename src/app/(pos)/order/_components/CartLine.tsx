"use client";

interface CartLineProps {
  name: string;
  qty: number;
  unitPrice: string;
  lineTotal: string;
  onInc?: () => void;
  onDec?: () => void;
  locked?: boolean; // fired to the kitchen — qty shown, no controls
}

export function CartLine({ name, qty, unitPrice, lineTotal, onInc, onDec, locked }: CartLineProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-gray-900">{name}</p>
        <p className="text-xs text-gray-500">₹{parseFloat(unitPrice).toFixed(0)} each</p>
      </div>
      {locked ? (
        <span className="w-12 text-center text-sm font-semibold text-gray-500">{qty}×</span>
      ) : (
        <div className="flex items-center gap-1">
          <button
            onClick={onDec}
            className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 text-sm text-gray-600 hover:bg-gray-100"
          >
            −
          </button>
          <span className="w-6 text-center text-sm font-semibold">{qty}</span>
          <button
            onClick={onInc}
            className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 text-sm text-gray-600 hover:bg-gray-100"
          >
            +
          </button>
        </div>
      )}
      <span className="w-16 text-right text-sm font-semibold text-gray-900">
        ₹{parseFloat(lineTotal).toFixed(0)}
      </span>
    </div>
  );
}
