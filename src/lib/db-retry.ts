// Retry transient DB-connection failures (flaky DNS / network blips to Neon)
// a few times before giving up, so a momentary `EAI_AGAIN` / reset doesn't 500
// the whole request. Only retries TRANSIENT errors — real query/constraint
// errors throw immediately.
const TRANSIENT = [
  "EAI_AGAIN",      // DNS: temporary resolution failure
  "ENOTFOUND",      // DNS: not resolved
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "P1001",          // Prisma: can't reach database server
  "P1017",          // Prisma: server closed the connection
];

function isTransient(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const code = (e as { code?: unknown }).code;
  if (typeof code === "string" && TRANSIENT.includes(code)) return true;
  const msg = (e as { message?: unknown }).message;
  if (typeof msg === "string") {
    return TRANSIENT.some((t) => msg.includes(t)) || msg.includes("Can't reach database");
  }
  return false;
}

export async function withDbRetry<T>(fn: () => Promise<T>, tries = 3): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < tries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (!isTransient(e) || attempt === tries - 1) throw e;
      await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
    }
  }
  throw lastErr;
}
