"use client";

interface ProductCardProps {
  name: string;
  price: string;
  categoryColor: string;
  onClick: () => void;
}

export function ProductCard({ name, price, categoryColor, onClick }: ProductCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start rounded-xl border border-gray-200 bg-white p-3 text-left shadow-sm transition-all hover:border-blue-300 hover:shadow-md active:scale-95"
    >
      <div
        className="mb-2 h-1.5 w-8 rounded-full"
        style={{ backgroundColor: categoryColor }}
      />
      <span className="text-sm font-semibold text-gray-900 leading-tight">{name}</span>
      <span className="mt-1 text-sm font-bold text-blue-600">₹{parseFloat(price).toFixed(0)}</span>
    </button>
  );
}
