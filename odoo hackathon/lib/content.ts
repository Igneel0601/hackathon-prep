import {
  LayoutDashboard,
  Users,
  CreditCard,
  Settings,
  BarChart3,
  FileText,
  LifeBuoy,
  type LucideIcon,
} from "lucide-react";

/** Brand label used in the AppShell top bar. Swap freely — no styling lives here. */
export const brand = {
  name: "Acme Kit",
  tagline: "Neutral component starter",
};

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

/** Primary navigation, consumed by the dashboard AppShell sidebar/drawer. */
export const nav: NavItem[] = [
  { label: "Overview", href: "#overview", icon: LayoutDashboard },
  { label: "Analytics", href: "#analytics", icon: BarChart3 },
  { label: "Customers", href: "#customers", icon: Users, badge: "12" },
  { label: "Billing", href: "#billing", icon: CreditCard },
  { label: "Reports", href: "#reports", icon: FileText },
  { label: "Settings", href: "#settings", icon: Settings },
];

export const secondaryNav: NavItem[] = [
  { label: "Support", href: "#support", icon: LifeBuoy },
];

/** Top-level demo routes, used by the index page and the kit nav. */
export const demos = [
  { label: "Hero", href: "/_demos/hero", description: "Marketing entrance with GSAP reveal." },
  { label: "Dashboard", href: "/_demos/dashboard", description: "AppShell, stats grid and a responsive table." },
  { label: "Detail", href: "/_demos/detail", description: "Two-column form + summary layout." },
  { label: "Kit", href: "/_demos/kit", description: "Living style guide — every primitive and state." },
];

/* ------------------------------------------------------------------ */
/* Lorem content for the screen skeletons (kept out of the JSX).       */
/* ------------------------------------------------------------------ */

export const hero = {
  eyebrow: "Reskinnable by design",
  title: "Ship product surfaces in one neutral system.",
  subtitle:
    "Every component is driven by CSS variables. Change a handful of tokens and the entire kit — type, color, radius, shadow — follows. No forked mobile tree, no one-off styles.",
  primaryCta: "Get started",
  secondaryCta: "Read the docs",
  stats: [
    { label: "Primitives", value: "16" },
    { label: "Breakpoints", value: "375 → 1440" },
    { label: "One source", value: "globals.css" },
  ],
};

export const stats = [
  { label: "Monthly revenue", value: "$48.2k", delta: "+12.4%", trend: "up" as const },
  { label: "Active users", value: "8,210", delta: "+3.1%", trend: "up" as const },
  { label: "Churn", value: "1.8%", delta: "-0.4%", trend: "down" as const },
  { label: "Open tickets", value: "23", delta: "+5", trend: "up" as const },
];

export type Row = {
  id: string;
  name: string;
  email: string;
  plan: "Free" | "Pro" | "Enterprise";
  status: "active" | "trialing" | "past_due";
  mrr: string;
};

export const tableRows: Row[] = [
  { id: "u_01", name: "Mara Holloway", email: "mara@northwind.io", plan: "Enterprise", status: "active", mrr: "$1,200" },
  { id: "u_02", name: "Devin Ortiz", email: "devin@lumen.dev", plan: "Pro", status: "trialing", mrr: "$49" },
  { id: "u_03", name: "Priya Raman", email: "priya@cobalt.app", plan: "Pro", status: "active", mrr: "$49" },
  { id: "u_04", name: "Samuel Vance", email: "sam@driftwork.co", plan: "Free", status: "past_due", mrr: "$0" },
  { id: "u_05", name: "Yara Nasser", email: "yara@quill.studio", plan: "Enterprise", status: "active", mrr: "$2,400" },
  { id: "u_06", name: "Tom Becker", email: "tom@halo.systems", plan: "Pro", status: "active", mrr: "$49" },
];

export const detail = {
  title: "Edit customer",
  subtitle: "Update profile, plan and notification preferences.",
  planOptions: [
    { value: "free", label: "Free" },
    { value: "pro", label: "Pro" },
    { value: "enterprise", label: "Enterprise" },
  ],
  regionOptions: [
    { value: "us", label: "United States" },
    { value: "eu", label: "Europe" },
    { value: "apac", label: "Asia Pacific" },
  ],
};
