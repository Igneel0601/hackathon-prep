// Admin shell — Server Component. Authoritative role gate: only ADMIN gets in.
// (The proxy is cookie-only and can't read the role; this is the real check.)
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminNav } from "./_components/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  if (session.user.role !== "ADMIN") redirect("/");

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminNav />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
