"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import gsap from "gsap";
import { cn } from "@/lib/cn";

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  /** Footer slot — typically Buttons. Stacks on mobile, right-aligns on sm:. */
  footer?: React.ReactNode;
  /** Disable closing on overlay click. Esc still closes unless you also handle that. */
  dismissable?: boolean;
  className?: string;
};

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  dismissable = true,
  className,
}: ModalProps) {
  // Keep mounted through the exit animation.
  const [mounted, setMounted] = useState(open);
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  // Enter / exit orchestration (GSAP — this is a presence transition, not a micro-state).
  useEffect(() => {
    const overlay = overlayRef.current;
    const panel = panelRef.current;
    if (!mounted || !overlay || !panel) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 639px)").matches;

    if (open) {
      lastFocused.current = document.activeElement as HTMLElement;
      panel.querySelector<HTMLElement>(FOCUSABLE)?.focus();
      if (reduce) {
        gsap.set([overlay, panel], { clearProps: "all" });
        return;
      }
      const tl = gsap.timeline();
      tl.fromTo(overlay, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, ease: "power1.out" });
      tl.fromTo(
        panel,
        mobile ? { yPercent: 100 } : { autoAlpha: 0, y: 16, scale: 0.98 },
        mobile
          ? { yPercent: 0, duration: 0.32, ease: "power3.out" }
          : { autoAlpha: 1, y: 0, scale: 1, duration: 0.28, ease: "power3.out" },
        "-=0.1"
      );
      return () => tl.kill();
    } else {
      if (reduce) {
        setMounted(false);
        return;
      }
      const tl = gsap.timeline({ onComplete: () => setMounted(false) });
      tl.to(panel, mobile ? { yPercent: 100, duration: 0.24, ease: "power2.in" } : { autoAlpha: 0, y: 12, scale: 0.98, duration: 0.2, ease: "power2.in" });
      tl.to(overlay, { autoAlpha: 0, duration: 0.18 }, "-=0.12");
      return () => tl.kill();
    }
  }, [open, mounted]);

  // Restore focus when fully closed.
  useEffect(() => {
    if (!mounted) lastFocused.current?.focus?.();
  }, [mounted]);

  // Lock body scroll while open.
  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape" && dismissable) {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null
      );
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [dismissable, onClose]
  );

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={overlayRef}
      onMouseDown={(e) => {
        if (dismissable && e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onKeyDown={onKeyDown}
        className={cn(
          "flex max-h-[92dvh] w-full flex-col bg-bg-2 shadow-soft " +
            "rounded-t-lg border-t border-border " +
            "sm:max-w-lg sm:rounded-lg sm:border",
          className
        )}
      >
        {(title || dismissable) && (
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div className="flex flex-col gap-1">
              {title && <h2 className="text-base font-semibold text-fg">{title}</h2>}
              {description && <p className="text-sm text-fg-muted">{description}</p>}
            </div>
            {dismissable && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="-mr-1 -mt-1 inline-flex size-9 shrink-0 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-bg-3 hover:text-fg"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5 py-4 text-sm text-fg-muted">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-3 border-t border-border px-5 py-4 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
