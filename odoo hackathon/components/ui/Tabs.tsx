"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { cn } from "@/lib/cn";

export type TabItem = {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
};

export type TabsProps = {
  tabs: TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  "aria-label"?: string;
  className?: string;
};

export function Tabs({
  tabs,
  value,
  defaultValue,
  onValueChange,
  "aria-label": ariaLabel = "Tabs",
  className,
}: TabsProps) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue ?? tabs[0]?.value);
  const active = isControlled ? value : internal;

  const listRef = useRef<HTMLDivElement>(null);
  const underlineRef = useRef<HTMLSpanElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const select = (next: string) => {
    if (!isControlled) setInternal(next);
    onValueChange?.(next);
  };

  // Move the underline under the active tab (orchestrated, GSAP).
  const positionUnderline = (animate: boolean) => {
    const list = listRef.current;
    const underline = underlineRef.current;
    const btn = active ? btnRefs.current[active] : null;
    if (!list || !underline || !btn) return;
    const x = btn.offsetLeft;
    const w = btn.offsetWidth;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!animate || reduce) {
      gsap.set(underline, { x, width: w });
    } else {
      gsap.to(underline, { x, width: w, duration: 0.3, ease: "power3.out" });
    }
  };

  useLayoutEffect(() => {
    positionUnderline(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    const onResize = () => positionUnderline(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const enabled = tabs.filter((t) => !t.disabled);
    const idx = enabled.findIndex((t) => t.value === active);
    let nextIdx = idx;
    if (e.key === "ArrowRight") nextIdx = (idx + 1) % enabled.length;
    else if (e.key === "ArrowLeft") nextIdx = (idx - 1 + enabled.length) % enabled.length;
    else if (e.key === "Home") nextIdx = 0;
    else if (e.key === "End") nextIdx = enabled.length - 1;
    else return;
    e.preventDefault();
    const next = enabled[nextIdx];
    if (next) {
      select(next.value);
      btnRefs.current[next.value]?.focus();
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        ref={listRef}
        role="tablist"
        aria-label={ariaLabel}
        onKeyDown={onKeyDown}
        className="relative flex gap-1 overflow-x-auto border-b border-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((t) => {
          const selected = t.value === active;
          return (
            <button
              key={t.value}
              ref={(el) => {
                btnRefs.current[t.value] = el;
              }}
              role="tab"
              type="button"
              id={`tab-${t.value}`}
              aria-selected={selected}
              aria-controls={`panel-${t.value}`}
              tabIndex={selected ? 0 : -1}
              disabled={t.disabled}
              onClick={() => select(t.value)}
              className={cn(
                "inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap px-3 text-sm font-medium " +
                  "transition-colors duration-150 disabled:opacity-40 [&_svg]:size-4",
                selected ? "text-fg" : "text-fg-muted hover:text-fg"
              )}
            >
              {t.icon}
              {t.label}
            </button>
          );
        })}
        <span
          ref={underlineRef}
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 h-0.5 rounded-pill bg-accent"
        />
      </div>
    </div>
  );
}
