// Self-checkout (kiosk) support. Guest orders have no logged-in cashier, but the
// schema requires every order to attach to a PosSession (owned by a User). So we
// back all kiosk orders with a single lazily-created service account — no schema
// or seed change needed. This account is never used to log in (no password).
import { db } from "@/lib/db";
import { getOpenPosSession } from "@/lib/api";

const KIOSK_EMAIL = "kiosk@odoocafe.local";

/** Resolve (creating if needed) the kiosk service account's open PosSession. */
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
