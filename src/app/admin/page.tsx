import Link from "next/link";
import { getAdminStats } from "@/lib/admin-stats";
import { AdminPageHeader } from "./_components/AdminPageHeader";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default async function AdminDashboard() {
  const stats = await getAdminStats();

  const statCards = [
    {
      label: "Today's Revenue",
      value: inr(Math.round(stats.today.revenue)),
      sub: `${stats.today.orders} orders`,
      accent: "#FFBC0D",
      bar: "#FFBC0D",
    },
    {
      label: "Menu Items",
      value: String(stats.products.total),
      sub: `${stats.categories.total} categories`,
      note: stats.products.inactive > 0 ? `${stats.products.inactive} inactive` : undefined,
      noteColor: "#7A2E12",
      accent: "#1A0A04",
      bar: "#5C3020",
    },
    {
      label: "Tables Occupied",
      value: `${stats.tables.occupied} / ${stats.tables.total}`,
      sub: "Floor + Terrace",
      note: stats.tables.total > 0 ? `${Math.round((stats.tables.occupied / stats.tables.total) * 100)}% full` : undefined,
      noteColor: "#7A2E12",
      accent: "#1A0A04",
      bar: "#7A2E12",
    },
    {
      label: "Active Staff",
      value: String(stats.users.activeStaff),
      sub: `${stats.users.total} total staff`,
      note: stats.users.activeStaff > 0 ? "On shift" : undefined,
      noteColor: "#5C3020",
      accent: "#1A0A04",
      bar: "#5C3020",
    },
  ];

  const cards: {
    href: string; title: string; desc: string; icon: React.ReactNode; badges: { label: string; tone: "gold" | "red" | "green" | "neutral" }[];
  }[] = [
    {
      href: "/admin/products", title: "Products", desc: "Manage menu, prices & tax",
      icon: <CoffeeIcon />,
      badges: [
        { label: `${stats.products.total} items`, tone: "gold" },
        ...(stats.products.inactive > 0 ? [{ label: `${stats.products.inactive} inactive`, tone: "red" as const }] : []),
      ],
    },
    {
      href: "/admin/categories", title: "Categories", desc: "Group products, set colours",
      icon: <TagIcon />,
      badges: [{ label: `${stats.categories.total} categories`, tone: "gold" }],
    },
    {
      href: "/admin/booking", title: "Floors & Tables", desc: "Floor plan & seating",
      icon: <TableIcon />,
      badges: [
        { label: `${stats.tables.occupied} occupied`, tone: "red" },
        { label: `${stats.tables.free} free`, tone: "green" },
      ],
    },
    {
      href: "/admin/payment-methods", title: "Payment Methods", desc: "Cash / Card / UPI",
      icon: <CardIcon />,
      badges: [{ label: "3 enabled", tone: "green" }],
    },
    {
      href: "/admin/coupons", title: "Coupons & Promos", desc: "Discounts & offers",
      icon: <TicketIcon />,
      badges: [{ label: "Manage", tone: "neutral" }],
    },
    {
      href: "/admin/users", title: "Users", desc: "Staff & roles",
      icon: <UsersIcon />,
      badges: [
        { label: `${stats.users.total} staff`, tone: "gold" },
        { label: `${stats.users.admins} admin`, tone: "neutral" },
      ],
    },
    {
      href: "/admin/reports", title: "Reports", desc: "Sales & insights",
      icon: <ChartIcon />,
      badges: [{ label: `Today ${inr(Math.round(stats.today.revenue))}`, tone: "gold" }],
    },
    {
      href: "/kds", title: "Kitchen Display", desc: "Live order tickets",
      icon: <KitchenIcon />,
      badges: [{ label: `${stats.today.kitchenActive} active`, tone: "red" }],
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      <AdminPageHeader
        title="Dashboard"
        subtitle="Configure the cafe. Changes reflect in the POS terminal."
        actionLabel="Add Product"
        actionHref="/admin/products"
      />

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((c) => (
          <div
            key={c.label}
            className="relative overflow-hidden rounded-2xl p-4"
            style={{ background: "#FDFAF5", border: "1px solid rgba(92,48,32,0.10)", boxShadow: "0 2px 14px rgba(13,5,2,0.05)" }}
          >
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.1em]" style={{ color: "#9B6B55" }}>{c.label}</p>
            <p className="mt-1.5 text-3xl font-extrabold leading-none" style={{ fontFamily: "var(--font-display)", color: c.accent, letterSpacing: "-0.02em" }}>
              {c.value}
            </p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs" style={{ color: "#9B6B55" }}>{c.sub}</span>
              {c.note && <span className="text-xs font-bold" style={{ color: c.noteColor }}>{c.note}</span>}
            </div>
            <span className="absolute inset-x-0 bottom-0 h-1" style={{ background: c.bar, opacity: 0.85 }} />
          </div>
        ))}
      </div>

      {/* Section cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group flex items-start gap-3.5 rounded-2xl p-4 transition-all hover:-translate-y-0.5"
            style={{ background: "#FDFAF5", border: "1px solid rgba(92,48,32,0.10)", boxShadow: "0 2px 12px rgba(13,5,2,0.04)" }}
          >
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "rgba(92,48,32,0.06)", color: "#5C3020" }}
            >
              {c.icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="font-bold" style={{ color: "#1A0A04" }}>{c.title}</p>
                <span style={{ color: "rgba(92,48,32,0.35)" }} className="transition-transform group-hover:translate-x-0.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>
                </span>
              </div>
              <p className="mt-0.5 text-[0.8125rem]" style={{ color: "#9B6B55" }}>{c.desc}</p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {c.badges.map((b) => (
                  <Badge key={b.label} tone={b.tone}>{b.label}</Badge>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone: "gold" | "red" | "green" | "neutral" }) {
  const tones = {
    gold: { bg: "rgba(255,188,13,0.14)", color: "#8B5E00" },
    red: { bg: "rgba(122,46,18,0.10)", color: "#7A2E12" },
    green: { bg: "rgba(92,48,32,0.10)", color: "#5C3020" },
    neutral: { bg: "rgba(92,48,32,0.08)", color: "#5C3020" },
  }[tone];
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide"
      style={{ background: tones.bg, color: tones.color }}
    >
      {children}
    </span>
  );
}

const ic = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
function CoffeeIcon() { return <svg {...ic}><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></svg>; }
function TagIcon() { return <svg {...ic}><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42Z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>; }
function TableIcon() { return <svg {...ic}><path d="M3 10h18"/><path d="M5 6h14a2 2 0 0 1 2 2v2H3V8a2 2 0 0 1 2-2Z"/><path d="M4 10v8"/><path d="M20 10v8"/><path d="M8 10v4"/><path d="M16 10v4"/></svg>; }
function CardIcon() { return <svg {...ic}><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>; }
function TicketIcon() { return <svg {...ic}><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v14"/></svg>; }
function UsersIcon() { return <svg {...ic}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function ChartIcon() { return <svg {...ic}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>; }
function KitchenIcon() { return <svg {...ic}><path d="M3 11h18"/><path d="M12 3v8"/><path d="M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8"/></svg>; }
