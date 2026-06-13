// Self-checkout (kiosk) support. Guest orders have no logged-in employee, but
// Order.sessionId requires a PosSession owned by a User. Kiosk orders attach
// to a seeded/lazily-created system user with one open PosSession — no schema
// change needed, and this account is never used to log in (no password).
import { db } from "@/lib/db";
import { getOpenPosSession } from "@/lib/api";

export const KIOSK_USER_EMAIL = "kiosk@cafe.internal";
const KIOSK_EMAIL = "kiosk@odoocafe.local";

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

/** Resolve (creating if needed) the other kiosk service account's open PosSession. */
export async function ensureKioskSession(): Promise<{ sessionId: string; kioskUserId: string }> {
  const kiosk = await db.user.upsert({
    where: { email: KIOSK_EMAIL },
    update: {},
    create: { email: KIOSK_EMAIL, name: "Self-Checkout Kiosk", role: "EMPLOYEE" },
    select: { id: true },
  });
  const session = await getOpenPosSession(kiosk.id);
  return { sessionId: session.id, kioskUserId: kiosk.id };
}
