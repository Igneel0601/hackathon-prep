"use client";

export function ComingSoon({ label, onGetStarted }: { label: string; onGetStarted?: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center px-6 text-center"
      style={{
        background: "#FDFAF5",
        border: "1px solid rgba(92,48,32,0.10)",
        borderRadius: 16,
        padding: "64px 24px",
        boxShadow: "0 2px 16px rgba(13,5,2,0.05)",
      }}
    >
      <div
        className="mb-4 flex items-center justify-center rounded-2xl"
        style={{ width: 56, height: 56, background: "rgba(92,48,32,0.06)", color: "#9B6B55" }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
        </svg>
      </div>
      <p className="text-lg font-bold" style={{ fontFamily: "var(--font-display)", color: "#1A0A04" }}>
        {label} — Coming Soon
      </p>
      <p className="mt-1.5 max-w-xs text-sm" style={{ color: "#9B6B55" }}>
        This section is in progress. Click “Add New” to create your first entry.
      </p>
      <button
        onClick={onGetStarted}
        className="mt-5 flex items-center gap-1.5 rounded-lg px-4 text-sm font-bold transition-transform active:scale-95"
        style={{ height: 40, background: "#FFBC0D", color: "#1A0A04", boxShadow: "0 4px 14px rgba(255,188,13,0.34)" }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14"/><path d="M5 12h14"/>
        </svg>
        Get Started
      </button>
    </div>
  );
}
