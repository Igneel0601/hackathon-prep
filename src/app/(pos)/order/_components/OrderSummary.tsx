"use client";

interface OrderSummaryProps {
  subtotal: string;
  tax: string;
  discount: string;
  total: string;
}

export function OrderSummary({ subtotal, tax, discount, total }: OrderSummaryProps) {
  return (
    <div className="space-y-1 border-t border-gray-200 pt-3 text-sm">
      <div className="flex justify-between text-gray-600">
        <span>Subtotal</span>
        <span>₹{parseFloat(subtotal).toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-gray-600">
        <span>Tax</span>
        <span>₹{parseFloat(tax).toFixed(2)}</span>
      </div>
      {parseFloat(discount) > 0 && (
        <div className="flex justify-between text-green-600">
          <span>Discount</span>
          <span>−₹{parseFloat(discount).toFixed(2)}</span>
        </div>
      )}
      <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900">
        <span>Total</span>
        <span>₹{parseFloat(total).toFixed(2)}</span>
      </div>
    </div>
  );
}
