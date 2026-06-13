// Tiny request-body validators. Each throws ApiError(400) on bad input, so
// route handlers stay inline-style (no zod) but without copy-pasted guards.
//   const name = str(body.name, "name");
//   const price = decimalStr(body.price, "price");
import { ApiError } from "@/lib/api-error";

export function str(v: unknown, field: string, { min = 1, max = 5000 } = {}): string {
  if (typeof v !== "string") throw new ApiError(400, `${field} must be a string`);
  const t = v.trim();
  if (t.length < min) throw new ApiError(400, `${field} is required`);
  if (t.length > max) throw new ApiError(400, `${field} is too long`);
  return t;
}

export function int(v: unknown, field: string, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}): number {
  if (typeof v !== "number" || !Number.isInteger(v)) {
    throw new ApiError(400, `${field} must be an integer`);
  }
  if (v < min || v > max) throw new ApiError(400, `${field} is out of range`);
  return v;
}

/** A non-negative finite money/number value, returned as a string for Prisma.Decimal. */
export function decimalStr(v: unknown, field: string, { min = 0 } = {}): string {
  const n = typeof v === "string" ? Number(v) : v;
  if (typeof n !== "number" || !Number.isFinite(n)) {
    throw new ApiError(400, `${field} must be a number`);
  }
  if (n < min) throw new ApiError(400, `${field} must be ≥ ${min}`);
  return String(n);
}

export function bool(v: unknown, field: string): boolean {
  if (typeof v !== "boolean") throw new ApiError(400, `${field} must be true or false`);
  return v;
}

export function oneOf<T extends string>(v: unknown, field: string, allowed: readonly T[]): T {
  if (typeof v !== "string" || !allowed.includes(v as T)) {
    throw new ApiError(400, `${field} must be one of: ${allowed.join(", ")}`);
  }
  return v as T;
}

/** Returns undefined when the value is null/undefined, else runs the validator. */
export function optional<T>(
  v: unknown,
  fn: (val: unknown) => T,
): T | undefined {
  return v === undefined || v === null ? undefined : fn(v);
}
