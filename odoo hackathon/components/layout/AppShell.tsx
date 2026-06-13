"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import gsap from "gsap";
import { cn } from "@/lib/cn";

export type AppShellProps = {
  /** Brand / logo slot, far left of the top bar. */
  brand?: React.ReactNode;
  /** Inline top-bar nav (desktop only — hidden under lg:). */
  nav?: React.ReactNode;
  /** Right-aligned actions in the top bar (search, avatar, buttons). */
  rightActions?: React.ReactNode;
  /** Persistent left sidebar on lg:; collapses into the mobile drawer below lg:. */
  sidebar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';

export function AppShell({ brand, nav, rightActions, sidebar, children, className }: AppShellProps) {
  const hasSidebar = !!sidebar;
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const openDrawer = () => {
    setMounted(true);
    setOpen(true);
  };
  const closeDrawer = () => setOpen(false);

  // GSAP slide-in / out for the mobile drawer.
  useEffect(() => {
    if (!mounted) return;
    const overlay = overlayRef.current;
    const panel = panelRef.current;
    if (!overlay || !panel) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (open) {
      panel.querySelector<HTMLElement>(FOCUSABLE)?.focus();
      if (reduce) {
        gsap.set([overlay, panel], { clearProps: "all" });
        return;
      }
      const tl = gsap.timeline();
      tl.fromTo(overlay, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 });
      tl.fromTo(panel, { xPercent: -100 }, { xPercent: 0, duration: 0.34, ease: "power3.out" }, "-=0.1");
      return () => tl.kill();
    } else {
      if (reduce) {
        setMounted(false);
        triggerRef.current?.focus();
        return;
      }
      const tl = gsap.timeline({
        onComplete: () => {
          setMounted(false);
          triggerRef.current?.focus();
        },
      });
      tl.to(panel, { xPercent: -100, duration: 0.26, ease: "power2.in" });
      tl.to(overlay, { autoAlpha: 0, duration: 0.18 }, "-=0.14");
      return () => tl.kill();
    }
  }, [open, mounted]);

  // Lock scroll while the drawer is open.
  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted]);

  const onDrawerKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key !== "Tab") return;
    const panel = panelRef.current;
    if (!panel) return;
    const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => el.offsetParent !== null
    );
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  return (
    <div className={cn("min-h-dvh bg-bg", className)}>
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          {hasSidebar && (
            <button
              ref={triggerRef}
              type="button"
              onClick={openDrawer}
              aria-label="Open menu"
              aria-expanded={open}
              className="inline-flex size-11 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-bg-3 hover:text-fg lg:hidden"
            >
              <Menu className="size-5" />
            </button>
          )}
          <div className="flex min-w-0 items-center gap-2">{brand}</div>
          {nav && <nav className="ml-2 hidden items-center gap-1 lg:flex">{nav}</nav>}
          <div className="ml-auto flex items-center gap-2">{rightActions}</div>
        </div>
      </header>

      <div className="flex">
        {/* Persistent desktop sidebar */}
        {hasSidebar && (
          <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-64 shrink-0 overflow-y-auto border-r border-border p-4 lg:block">
            {sidebar}
          </aside>
        )}

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      {/* Mobile drawer */}
      {hasSidebar && mounted && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            ref={overlayRef}
            onClick={closeDrawer}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            onKeyDown={onDrawerKeyDown}
            className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col overflow-y-auto border-r border-border bg-bg-2 p-4 shadow-soft"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex min-w-0 items-center gap-2">{brand}</div>
              <button
                type="button"
                onClick={closeDrawer}
                aria-label="Close menu"
                className="inline-flex size-9 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-bg-3 hover:text-fg"
              >
                <X className="size-4" />
              </button>
            </div>
            <div onClick={closeDrawer}>{sidebar}</div>
          </aside>
        </div>
      )}
    </div>
  );
}
