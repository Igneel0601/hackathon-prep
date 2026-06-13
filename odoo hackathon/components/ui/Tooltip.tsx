"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/cn";

type Side = "top" | "bottom" | "left" | "right";

export type TooltipProps = {
  content: React.ReactNode;
  side?: Side;
  children: React.ReactElement;
  className?: string;
};

const sideClasses: Record<Side, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

/**
 * Accessible tooltip: shows on hover AND keyboard focus, hides on blur/leave/Esc.
 * Wrap a single focusable element. Show/hide is a CSS micro-state.
 */
export function Tooltip({ content, side = "top", children, className }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
    >
      <span aria-describedby={open ? id : undefined} className="inline-flex">
        {children}
      </span>
      <span
        role="tooltip"
        id={id}
        className={cn(
          "pointer-events-none absolute z-50 w-max max-w-xs rounded-md border border-border " +
            "bg-bg-3 px-2.5 py-1.5 text-xs text-fg shadow-soft " +
            "transition-opacity duration-150",
          sideClasses[side],
          open ? "opacity-100" : "opacity-0",
          className
        )}
      >
        {content}
      </span>
    </span>
  );
}
