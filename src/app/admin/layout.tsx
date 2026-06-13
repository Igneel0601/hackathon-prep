// Admin shell — Server Component. Authoritative role gate: only ADMIN gets in.
// (The proxy is cookie-only and can't read the role; this is the real check.)
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAdminStats } from "@/lib/admin-stats";
import { AdminNav } from "./_components/AdminNav";
import { AdminTopbar } from "./_components/AdminTopbar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  if (session.user.role !== "ADMIN") redirect("/");

  const stats = await getAdminStats();
  const user = {
    name: session.user.name ?? "Admin User",
    role: session.user.role === "ADMIN" ? "Super Admin" : "Staff",
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F1ECE6" }}>
      <AdminNav
        user={user}
        badges={{
          products: stats.products.total,
          tables: stats.tables.occupied,
        }}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
