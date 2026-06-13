// Admin: list + create users. See docs/apis/admin/users/route.md.
import { type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { ApiError, errorResponse, json, requireRole } from "@/lib/api";
import { str, oneOf } from "@/lib/validate";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "EMPLOYEE";
  active: boolean;
  createdAt: Date;
};

function serialize(u: UserRow) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    active: u.active,
    createdAt: u.createdAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  try {
    await requireRole("ADMIN");
    const sp = request.nextUrl.searchParams;
    const q = sp.get("q")?.trim();
    const roleParam = sp.get("role");
    const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(sp.get("pageSize") ?? "50", 10) || 50));

    const where: Prisma.UserWhereInput = {
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(roleParam === "ADMIN" || roleParam === "EMPLOYEE" ? { role: roleParam } : {}),
    };

    const [rows, total] = await Promise.all([
      db.user.findMany({
        where,
        orderBy: { createdAt: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
      }),
      db.user.count({ where }),
    ]);
    return json({ data: rows.map(serialize), total, page, pageSize });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole("ADMIN");
    let body: { name?: unknown; email?: unknown; role?: unknown; password?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      throw new ApiError(400, "Invalid JSON body");
    }
    const name = str(body.name, "name", { max: 80 });
    const email = str(body.email, "email", { max: 120 }).toLowerCase();
    if (!email.includes("@")) throw new ApiError(400, "a valid email is required");
    const role = oneOf(body.role, "role", ["ADMIN", "EMPLOYEE"] as const);
    const password = str(body.password, "password", { min: 8, max: 200 });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await db.user.create({
      data: { name, email, role, passwordHash },
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    });
    return json(serialize(user), 201);
  } catch (e) {
    return errorResponse(e);
  }
}
