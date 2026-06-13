"use client";

import Image from "next/image";
import { getProductImage } from "@/lib/product-image";

interface ProductCardProps {
  name: string;
  price: string;
  categoryColor: string;
  onClick: () => void;
}

export function ProductCard({ name, price, categoryColor, onClick }: ProductCardProps) {
  const img = getProductImage(name, null, 400);

  return (
    <button
      data-testid="product-card"
      onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg active:translate-y-0"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image
          src={img}
          alt={name}
          fill
          sizes="(max-width: 768px) 50vw, 200px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span
          className="absolute left-2 top-2 h-2.5 w-2.5 rounded-full ring-2 ring-white/80"
          style={{ backgroundColor: categoryColor }}
        />
      </div>
      <div className="flex items-center justify-between gap-2 p-3">
        <span className="text-sm font-semibold leading-tight text-foreground line-clamp-2">
          {name}
        </span>
        <span className="shrink-0 rounded-lg bg-primary/10 px-2 py-1 text-sm font-bold text-primary">
          ₹{parseFloat(price).toFixed(0)}
        </span>
      </div>
    </button>
  );
}
