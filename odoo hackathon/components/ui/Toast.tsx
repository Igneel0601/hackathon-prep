"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import gsap from "gsap";
import { cn } from "@/lib/cn";

type Intent = "info" | "success" | "warn" | "danger";

export type ToastOptions = {
  title: string;
  description?: string;
  intent?: Intent;
  /** ms before auto-dismiss. 0 disables auto-dismiss. */
  duration?: number;
};

type ToastRecord = ToastOptions & { id: number; open: boolean };

type ToastContextValue = {
  toast: (opts: ToastOptions) => number;
  dismiss: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

const intentMeta: Record<Intent, { icon: typeof Info; color: string }> = {
  info: { icon: Info, color: "text-accent" },
  success: { icon: CheckCircle2, color: "text-success" },
  warn: { icon: AlertTriangle, color: "text-warn" },
  danger: { icon: XCircle, color: "text-danger" },
};

let counter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, open: false } : t)));
  }, []);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((opts: ToastOptions) => {
    const id = ++counter;
    setToasts((prev) => [...prev, { id, open: true, intent: "info", duration: 4500, ...opts }]);
    return id;
  }, []);

  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => setHost(document.body), []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      {host &&
        createPortal(
          <div
            className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col gap-2 p-4 sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-96 sm:p-0"
            aria-live="polite"
            aria-atomic="false"
          >
            {toasts.map((t) => (
              <ToastItem key={t.id} record={t} onDismiss={dismiss} onRemoved={remove} />
            ))}
          </div>,
          host
        )}
    </ToastContext.Provider>
  );
}

function ToastItem({
  record,
  onDismiss,
  onRemoved,
}: {
  record: ToastRecord;
  onDismiss: (id: number) => void;
  onRemoved: (id: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { icon: Icon, color } = intentMeta[record.intent ?? "info"];

  // Enter
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const tween = gsap.fromTo(
      el,
      { autoAlpha: 0, y: 24, scale: 0.96 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.32, ease: "power3.out" }
    );
    return () => {
      tween.kill();
    };
  }, []);

  // Auto-dismiss
  useEffect(() => {
    if (!record.duration) return;
    const id = window.setTimeout(() => onDismiss(record.id), record.duration);
    return () => window.clearTimeout(id);
  }, [record.duration, record.id, onDismiss]);

  // Exit
  useEffect(() => {
    if (record.open) return;
    const el = ref.current;
    if (!el) {
      onRemoved(record.id);
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      onRemoved(record.id);
      return;
    }
    const tween = gsap.to(el, {
      autoAlpha: 0,
      x: 24,
      scale: 0.96,
      duration: 0.22,
      ease: "power2.in",
      onComplete: () => onRemoved(record.id),
    });
    return () => {
      tween.kill();
    };
  }, [record.open, record.id, onRemoved]);

  return (
    <div
      ref={ref}
      role="status"
      className="pointer-events-auto flex items-start gap-3 rounded-lg border border-border bg-bg-2 p-4 shadow-soft"
    >
      <Icon className={cn("mt-0.5 size-5 shrink-0", color)} aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-sm font-medium text-fg">{record.title}</p>
        {record.description && <p className="text-sm text-fg-muted">{record.description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(record.id)}
        aria-label="Dismiss notification"
        className="-mr-1 -mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-md text-fg-dim transition-colors hover:bg-bg-3 hover:text-fg"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
