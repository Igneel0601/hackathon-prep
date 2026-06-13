"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type MenuItem = {
  label: string;
  icon?: LucideIcon;
  onSelect?: () => void;
  disabled?: boolean;
  danger?: boolean;
};

export type DropdownProps = {
  /** The trigger element. Cloned with the required ARIA + ref wiring is not used;
   *  instead pass any node and we wrap it in a button-like container. */
  trigger: React.ReactNode;
  items: MenuItem[];
  align?: "start" | "end";
  className?: string;
};

export function Dropdown({ trigger, items, align = "start", className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();

  const enabledIndexes = items
    .map((it, i) => (it.disabled ? -1 : i))
    .filter((i) => i >= 0);

  const close = (returnFocus = true) => {
    setOpen(false);
    setActiveIndex(-1);
    if (returnFocus) triggerRef.current?.focus();
  };

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // Focus the active item.
  useEffect(() => {
    if (open && activeIndex >= 0) itemRefs.current[activeIndex]?.focus();
  }, [open, activeIndex]);

  const openMenu = (toLast = false) => {
    setOpen(true);
    const idx = toLast ? enabledIndexes[enabledIndexes.length - 1] : enabledIndexes[0];
    setActiveIndex(idx ?? -1);
  };

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openMenu(false);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      openMenu(true);
    }
  };

  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    const pos = enabledIndexes.indexOf(activeIndex);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(enabledIndexes[(pos + 1) % enabledIndexes.length]);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(enabledIndexes[(pos - 1 + enabledIndexes.length) % enabledIndexes.length]);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(enabledIndexes[0]);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(enabledIndexes[enabledIndexes.length - 1]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Tab") {
      close(false);
    }
  };

  const choose = (item: MenuItem) => {
    if (item.disabled) return;
    item.onSelect?.();
    close();
  };

  return (
    <div ref={rootRef} className={cn("relative inline-flex", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => (open ? close(false) : openMenu(false))}
        onKeyDown={onTriggerKeyDown}
        className="inline-flex"
      >
        {trigger}
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          onKeyDown={onMenuKeyDown}
          className={cn(
            "absolute top-full z-50 mt-2 min-w-48 overflow-hidden rounded-lg border border-border " +
              "bg-bg-2 p-1 shadow-soft",
            align === "end" ? "right-0" : "left-0"
          )}
        >
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                role="menuitem"
                type="button"
                tabIndex={-1}
                disabled={item.disabled}
                onClick={() => choose(item)}
                onMouseEnter={() => !item.disabled && setActiveIndex(i)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm " +
                    "transition-colors disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0",
                  item.danger ? "text-danger" : "text-fg-muted",
                  activeIndex === i && !item.disabled && (item.danger ? "bg-danger/10 text-danger" : "bg-bg-3 text-fg")
                )}
              >
                {Icon && <Icon aria-hidden />}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
