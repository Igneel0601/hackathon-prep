import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kitchen Display | Cafe POS',
};

export default function KdsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white">
      <header className="flex items-center justify-between px-6 py-3 bg-zinc-900 border-b border-zinc-800 shrink-0">
        <h1 className="text-lg font-bold tracking-wide">Kitchen Display</h1>
        <span className="text-xs text-zinc-400">Auto-refreshes every 2.5s</span>
      </header>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
