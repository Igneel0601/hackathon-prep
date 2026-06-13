// Server-only aggregate stats for the admin shell + dashboard.
// Queried directly via Prisma (admin layout/pages are Server Components),
// so no extra API route or doc-sync surface is introduced.
import { db } from "@/lib/db";

export interface AdminStats {
  products: { total: number; inactive: number };
  categories: { total: number };
  tables: { total: number; occupied: number; free: number };
  users: { total: number; admins: number; activeStaff: number };
  today: { revenue: number; orders: number; kitchenActive: number };
}

export async function getAdminStats(): Promise<AdminStats> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    productTotal,
    productInactive,
    categoryTotal,
    tableTotal,
    occupiedTables,
    userTotal,
    adminTotal,
    openSessions,
    paidToday,
    kitchenActive,
  ] = await Promise.all([
    db.product.count(),
    db.product.count({ where: { active: false } }),
    db.category.count(),
    db.table.count(),
    db.table.count({ where: { orders: { some: { status: "DRAFT" } } } }),
    db.user.count(),
    db.user.count({ where: { role: "ADMIN" } }),
    db.posSession.findMany({ where: { closedAt: null }, select: { userId: true } }),
    db.order.findMany({
      where: { status: "PAID", createdAt: { gte: startOfDay } },
      select: { total: true },
    }),
    db.order.count({ where: { kitchenStatus: { in: ["TO_COOK", "PREPARING"] } } }),
  ]);

  const activeStaff = new Set(openSessions.map((s) => s.userId)).size;
  const revenue = paidToday.reduce((sum, o) => sum + Number(o.total), 0);

  return {
    products: { total: productTotal, inactive: productInactive },
    categories: { total: categoryTotal },
    tables: { total: tableTotal, occupied: occupiedTables, free: tableTotal - occupiedTables },
    users: { total: userTotal, admins: adminTotal, activeStaff },
    today: { revenue, orders: paidToday.length, kitchenActive },
  };
}
