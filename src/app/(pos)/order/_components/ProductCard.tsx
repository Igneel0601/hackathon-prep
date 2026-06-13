"use client";

interface ProductCardProps {
  name: string;
  price: string;
  categoryColor: string;
  onClick: () => void;
  cartQty?: number;
}

export function ProductCard({ name, price, categoryColor, onClick, cartQty }: ProductCardProps) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-start rounded-xl border p-3 text-left transition-all active:scale-[0.97]"
      style={{
        background: cartQty ? "rgba(255,188,13,0.04)" : "#fff",
        borderColor: cartQty ? "#FFBC0D" : "rgba(92,48,32,0.10)",
        borderWidth: "1.5px",
      }}
      onMouseEnter={e => {
        if (!cartQty) (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,188,13,0.50)";
      }}
      onMouseLeave={e => {
        if (!cartQty) (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(92,48,32,0.10)";
      }}
    >
      <div className="mb-2 h-1.5 w-8 rounded-full" style={{ backgroundColor: categoryColor }} />
      <span className="text-sm font-semibold leading-tight" style={{ color: "#1A0A04" }}>{name}</span>
      <span className="mt-1 text-base font-bold" style={{ fontFamily: "var(--cafe-font-display)", color: "#FFBC0D" }}>
        ₹{parseFloat(price).toFixed(0)}
      </span>
      {cartQty && (
        <span
          className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold"
          style={{ background: "#1A0A04", color: "#FAF3E8" }}
        >
          {cartQty}
        </span>
      )}
    </button>
  );
}
