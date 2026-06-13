// Minimal in-memory fixed-window rate limiter for PUBLIC (unauthenticated)
// endpoints — e.g. the self-checkout kiosk routes. Per-process only: good
// enough to blunt scripted abuse on a single-instance demo deploy. If we ever
// run multi-instance, swap the Map for a shared store (Upstash/Redis).
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/**
 * Returns `true` if the call is allowed, `false` if the key has exceeded
 * `limit` calls within the current `windowMs` window.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count++;
  return true;
}

/** Best-effort client IP from proxy headers (falls back to "unknown"). */
export function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
