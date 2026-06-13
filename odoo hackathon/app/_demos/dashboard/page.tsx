"use client";

import { Bell, Plus, TrendingUp, TrendingDown, MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import { AppShell, Container, PageHeader } from "@/components/layout";
import {
  Card,
  CardBody,
  Badge,
  Button,
  Avatar,
  Dropdown,
  useToast,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { brand, nav, secondaryNav, stats, tableRows, type Row } from "@/lib/content";

const statusTone: Record<Row["status"], "success" | "warn" | "danger"> = {
  active: "success",
  trialing: "warn",
  past_due: "danger",
};
const statusLabel: Record<Row["status"], string> = {
  active: "Active",
  trialing: "Trialing",
  past_due: "Past due",
};

function SidebarNav() {
  return (
    <nav className="flex h-full flex-col gap-1">
      {nav.map((item, i) => {
        const Icon = item.icon;
        const active = i === 0;
        return (
          <a
            key={item.label}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
              active ? "bg-bg-3 text-fg" : "text-fg-muted hover:bg-bg-3 hover:text-fg"
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.badge && <Badge tone="accent">{item.badge}</Badge>}
          </a>
        );
      })}
      <div className="mt-auto flex flex-col gap-1 pt-4">
        {secondaryNav.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.label}
              href={item.href}
              className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-fg-muted transition-colors hover:bg-bg-3 hover:text-fg"
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}

export default function DashboardDemo() {
  const { toast } = useToast();

  return (
    <AppShell
      brand={<span className="text-base font-semibold tracking-tight text-fg">{brand.name}</span>}
      sidebar={<SidebarNav />}
      rightActions={
        <>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Notifications"
            onClick={() => toast({ intent: "info", title: "Nothing new", description: "You're all caught up." })}
          >
            <Bell className="size-4" />
          </Button>
          <Avatar name="Mara Holloway" size="sm" />
        </>
      }
    >
      <Container className="py-8">
        <PageHeader
          title="Overview"
          subtitle="Key metrics across your workspace this month."
          actions={
            <Button
              leadingIcon={<Plus />}
              onClick={() => toast({ intent: "success", title: "Report created", description: "A new report draft is ready." })}
            >
              New report
            </Button>
          }
        />

        {/* Stat grid */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => {
            const up = s.trend === "up";
            const Trend = up ? TrendingUp : TrendingDown;
            return (
              <Card key={s.label}>
                <CardBody className="flex flex-col gap-2">
                  <span className="text-sm text-fg-muted">{s.label}</span>
                  <span className="text-2xl font-semibold tracking-tight text-fg">{s.value}</span>
                  <span className={cn("inline-flex items-center gap-1 text-xs font-medium", up ? "text-success" : "text-danger")}>
                    <Trend className="size-3.5" />
                    {s.delta}
                  </span>
                </CardBody>
              </Card>
            );
          })}
        </div>

        {/* Data table */}
        <Card className="mt-8 overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold text-fg">Customers</h2>
            <Badge tone="neutral">{tableRows.length} total</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-fg-dim">
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Plan</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">MRR</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {tableRows.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 transition-colors hover:bg-bg-3/40">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={r.name} size="sm" />
                        <div className="flex flex-col">
                          <span className="font-medium text-fg">{r.name}</span>
                          <span className="text-xs text-fg-dim">{r.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-fg-muted">{r.plan}</td>
                    <td className="px-5 py-3">
                      <Badge tone={statusTone[r.status]} dot>
                        {statusLabel[r.status]}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-fg">{r.mrr}</td>
                    <td className="px-5 py-3 text-right">
                      <Dropdown
                        align="end"
                        trigger={
                          <span className="inline-flex size-9 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-bg-3 hover:text-fg">
                            <MoreHorizontal className="size-4" />
                          </span>
                        }
                        items={[
                          { label: "View", icon: Eye, onSelect: () => toast({ title: `Viewing ${r.name}` }) },
                          { label: "Edit", icon: Pencil, onSelect: () => toast({ title: `Editing ${r.name}` }) },
                          { label: "Delete", icon: Trash2, danger: true, onSelect: () => toast({ intent: "danger", title: `Deleted ${r.name}` }) },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Container>
    </AppShell>
  );
}
