"use client";

interface OrderSummaryProps {
  subtotal: string;
  tax: string;
  discount: string;
  total: string;
}

export function OrderSummary({ subtotal, tax, discount, total }: OrderSummaryProps) {
  return (
    <div className="space-y-1.5 border-t border-border pt-3 text-sm">
      <div className="flex justify-between text-muted-foreground">
        <span>Subtotal</span>
        <span className="tabular-nums">₹{parseFloat(subtotal).toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-muted-foreground">
        <span>Tax</span>
        <span className="tabular-nums">₹{parseFloat(tax).toFixed(2)}</span>
      </div>
      {parseFloat(discount) > 0 && (
        <div className="flex justify-between text-emerald-600">
          <span>Discount</span>
          <span className="tabular-nums">−₹{parseFloat(discount).toFixed(2)}</span>
        </div>
      )}
      <div className="mt-1 flex justify-between border-t border-border pt-2.5 text-lg font-bold text-espresso">
        <span className="font-heading">Total</span>
        <span className="tabular-nums">₹{parseFloat(total).toFixed(2)}</span>
      </div>
    </div>
  );
}
