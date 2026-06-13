// Offline mode is gated by NEXT_PUBLIC_OFFLINE_MODE (set to "1" to enable).
// Off by default so the online demo is never affected. Set it in .env.local.
export const OFFLINE_ENABLED = process.env.NEXT_PUBLIC_OFFLINE_MODE === "1";
