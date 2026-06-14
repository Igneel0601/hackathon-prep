// Admin: set a user's password. See docs/apis/admin/users/[id]/password/route.md.
import { type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { ApiError, errorResponse, json, requireRole } from "@/lib/api";
import { str } from "@/lib/validate";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    let body: { password?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      throw new ApiError(400, "Invalid JSON body");
    }
    const password = str(body.password, "password", { min: 8, max: 200 });
    const passwordHash = await bcrypt.hash(password, 12);
    await db.user.update({ where: { id }, data: { passwordHash } });
    return json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
