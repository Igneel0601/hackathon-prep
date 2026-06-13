// POST /api/signup — create an email/password account. See docs/apis/signup/route.md.
import bcrypt from "bcryptjs";
import { ApiError, errorResponse, json } from "@/lib/api";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    let body: { name?: unknown; email?: unknown; password?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      throw new ApiError(400, "Invalid JSON body");
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!name) throw new ApiError(400, "name is required");
    if (!email || !email.includes("@")) throw new ApiError(400, "a valid email is required");
    if (password.length < 8) {
      throw new ApiError(400, "password must be at least 8 characters");
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      throw new ApiError(409, "An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await db.user.create({
      data: { name, email, passwordHash, role: "EMPLOYEE" },
      select: { id: true, name: true, email: true, role: true },
    });

    return json(user, 201);
  } catch (e) {
    return errorResponse(e);
  }
}
