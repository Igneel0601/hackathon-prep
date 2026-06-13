"use client";

import { cn } from "@/lib/utils";
import type { Category } from "@/lib/api-types";

interface CategoryTabsProps {
  categories: Category[];
  active: string | null;
  onChange: (id: string | null) => void;
}

export function CategoryTabs({ categories, active, onChange }: CategoryTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      <button
        onClick={() => onChange(null)}
        className={cn(
          "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
          active === null
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-secondary text-secondary-foreground hover:bg-accent/30",
        )}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id)}
          className={cn(
            "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            active === cat.id
              ? "text-white shadow-sm"
              : "bg-secondary text-secondary-foreground hover:bg-accent/30",
          )}
          style={active === cat.id ? { backgroundColor: cat.color } : undefined}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
