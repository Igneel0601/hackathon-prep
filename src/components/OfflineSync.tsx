"use client";

import { useEffect } from "react";
import { OFFLINE_ENABLED } from "@/lib/offline/flag";
import { flushPayments } from "@/lib/offline/store";

// Flushes the queued cash-payment outbox when the app loads and whenever the
// network returns. The interval is a safety net + lets the order's create sync
// land first (a payment 404s until its order exists, then succeeds on retry).
// No-ops entirely when offline mode is off.
export function OfflineSync() {
  useEffect(() => {
    if (!OFFLINE_ENABLED) return;
    const flush = () => void flushPayments();
    flush();
    window.addEventListener("online", flush);
    const id = setInterval(flush, 15000);
    return () => {
      window.removeEventListener("online", flush);
      clearInterval(id);
    };
  }, []);
  return null;
}
