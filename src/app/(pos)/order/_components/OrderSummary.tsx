"use client";

interface OrderSummaryProps {
  subtotal: string;
  tax: string;
  discount: string;
  total: string;
}

export function OrderSummary({ subtotal, tax, discount, total }: OrderSummaryProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-sm" style={{ color: "#9B6B55" }}>
        <span>Subtotal</span>
        <span>₹{parseFloat(subtotal).toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-sm" style={{ color: "#9B6B55" }}>
        <span>Tax</span>
        <span>₹{parseFloat(tax).toFixed(2)}</span>
      </div>
      {parseFloat(discount) > 0 && (
        <div className="flex justify-between text-sm font-medium" style={{ color: "#5C3020" }}>
          <span>Discount</span>
          <span>−₹{parseFloat(discount).toFixed(2)}</span>
        </div>
      )}
      <div
        className="flex justify-between pt-2 mt-1"
        style={{ borderTop: "1.5px solid rgba(92,48,32,0.14)" }}
      >
        <span className="text-base font-bold" style={{ color: "#1A0A04" }}>Total</span>
        <span className="text-lg font-extrabold" style={{ fontFamily: "var(--cafe-font-display)", color: "#1A0A04", letterSpacing: "-0.01em" }}>
          ₹{parseFloat(total).toFixed(2)}
        </span>
      </div>
    </div>
  );
}
