// Guards for destructive user-management actions. Server-only (queries the DB).
import { db } from "@/lib/db";
import { ApiError } from "@/lib/api-error";

/** You can't archive/delete/demote your own account. */
export function assertNotSelf(targetId: string, selfId: string) {
  if (targetId === selfId) {
    throw new ApiError(409, "You can't do that to your own account");
  }
}

/** There must always be at least one other active ADMIN besides `targetId`. */
export async function assertNotLastAdmin(targetId: string) {
  const others = await db.user.count({
    where: { role: "ADMIN", active: true, NOT: { id: targetId } },
  });
  if (others === 0) {
    throw new ApiError(409, "Can't remove the last active admin");
  }
}
