// Self-checkout (kiosk) orders have no logged-in employee, but Order.sessionId
// requires a PosSession owned by a User. Both attach to a seeded system user
// (see prisma/seed.ts) with one permanently-open PosSession.
import { db } from "@/lib/db";

export const KIOSK_USER_EMAIL = "kiosk@cafe.internal";

/** The kiosk system user's open PosSession, creating one if none is open. */
export async function getKioskSession() {
  const user = await db.user.findUniqueOrThrow({
    where: { email: KIOSK_USER_EMAIL },
    select: { id: true },
  });

  const existing = await db.posSession.findFirst({
    where: { userId: user.id, closedAt: null },
    orderBy: { openedAt: "desc" },
  });
  if (existing) return existing;

  try {
    return await db.posSession.create({ data: { userId: user.id } });
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && (e as { code: unknown }).code === "P2002") {
      const open = await db.posSession.findFirst({
        where: { userId: user.id, closedAt: null },
        orderBy: { openedAt: "desc" },
      });
      if (open) return open;
    }
    throw e;
  }
}
