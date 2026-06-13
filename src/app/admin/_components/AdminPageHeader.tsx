"use client";

import Link from "next/link";

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

function PlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14"/><path d="M5 12h14"/>
    </svg>
  );
}

const actionStyle = {
  height: 40,
  background: "#FFBC0D",
  color: "#1A0A04",
  boxShadow: "0 4px 14px rgba(255,188,13,0.34)",
} as const;

export function AdminPageHeader({ title, subtitle, actionLabel, actionHref, onAction }: AdminPageHeaderProps) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1
          className="text-3xl font-extrabold uppercase tracking-tight"
          style={{ fontFamily: "var(--font-display)", color: "#1A0A04", letterSpacing: "-0.01em" }}
        >
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm" style={{ color: "#9B6B55" }}>{subtitle}</p>}
      </div>

      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="flex shrink-0 items-center gap-1.5 rounded-lg px-4 text-sm font-bold transition-transform active:scale-95"
          style={actionStyle}
        >
          <PlusIcon />
          {actionLabel}
        </Link>
      )}
      {actionLabel && !actionHref && (
        <button
          onClick={onAction}
          className="flex shrink-0 items-center gap-1.5 rounded-lg px-4 text-sm font-bold transition-transform active:scale-95"
          style={actionStyle}
        >
          <PlusIcon />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
