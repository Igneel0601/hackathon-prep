"use client";

interface ProductCardProps {
  name: string;
  price: string;
  imageUrl: string;
  description?: string | null;
  onClick: () => void;
  cartQty?: number;
}

export function ProductCard({ name, price, imageUrl, description, onClick, cartQty }: ProductCardProps) {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-2xl transition-all"
      style={{
        background: "#fff",
        border: `1.5px solid ${cartQty ? "#FFBC0D" : "rgba(92,48,32,0.10)"}`,
        boxShadow: "0 2px 12px rgba(13,5,2,0.05)",
      }}
    >
      {/* Image */}
      <div className="relative" style={{ height: 116, background: "#F5F0EB" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={name} className="h-full w-full object-cover" loading="lazy" />
        {cartQty ? (
          <span
            className="absolute right-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold"
            style={{ background: "#1A0A04", color: "#FAF3E8", fontFamily: "var(--cafe-font-body)" }}
          >
            {cartQty}
          </span>
        ) : null}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-3">
        <p className="text-sm font-semibold leading-tight" style={{ fontFamily: "var(--cafe-font-body)", color: "#1A0A04" }}>
          {name}
        </p>
        {description && (
          <p className="mt-0.5 line-clamp-1 text-xs" style={{ color: "#9B6B55" }}>
            {description}
          </p>
        )}
        <p className="mt-1.5 text-base font-bold" style={{ fontFamily: "var(--cafe-font-body)", color: "#1A0A04" }}>
          ₹{parseFloat(price).toFixed(0)}
        </p>

        <button
          onClick={onClick}
          className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-bold transition-transform active:scale-95"
          style={{ background: "#FFBC0D", color: "#1A0A04" }}
        >
          {cartQty ? "Add more" : "Add"}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14"/><path d="M5 12h14"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
