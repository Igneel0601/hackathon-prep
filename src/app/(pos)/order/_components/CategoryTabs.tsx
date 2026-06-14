"use client";

import type { Category } from "@/lib/api-types";

interface CategoryTabsProps {
  categories: Category[];
  active: string | null;
  onChange: (id: string | null) => void;
}

export function CategoryTabs({ categories, active, onChange }: CategoryTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
      <button
        onClick={() => onChange(null)}
        className="shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-all"
        style={
          active === null
            ? { background: "#1A0A04", color: "#FAF3E8", border: "1.5px solid #1A0A04" }
            : { background: "transparent", color: "#5C3020", border: "1.5px solid rgba(92,48,32,0.18)" }
        }
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id)}
          className="shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-all"
          style={
            active === cat.id
              ? { background: "#1A0A04", color: "#FAF3E8", border: "1.5px solid #1A0A04" }
              : { background: "transparent", color: "#5C3020", border: "1.5px solid rgba(92,48,32,0.18)" }
          }
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
