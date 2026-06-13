"use client";

import { useEffect } from "react";
import { OFFLINE_ENABLED } from "@/lib/offline/flag";
import { flushOrders, flushPayments } from "@/lib/offline/store";

// Drains the offline outboxes when the app loads and whenever the network
// returns: ORDER creates first, then payments (the pay endpoint needs the order
// to exist server-side). Runs globally from the root layout so it doesn't depend
// on any screen being mounted. No-ops entirely when offline mode is off.
export function OfflineSync() {
  useEffect(() => {
    if (!OFFLINE_ENABLED) return;
    const flush = async () => {
      await flushOrders();
      await flushPayments();
    };
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
