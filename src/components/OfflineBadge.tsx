"use client";

import { useEffect, useState } from "react";

// Live online/offline indicator for the POS. Flips on the browser's online/offline
// events. (Pending-sync count is added once the order screen reads from the
// Legend-State store; for now this is a zero-coupling status pill.)
export function OfflineBadge() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={
        online
          ? { background: "rgba(22,128,60,0.10)", color: "#16803C" }
          : { background: "rgba(196,26,26,0.12)", color: "#C41A1A" }
      }
      title={online ? "Connected" : "Offline — orders queue and sync when you reconnect"}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ background: online ? "#16803C" : "#C41A1A" }}
      />
      {online ? "Online" : "Offline"}
    </span>
  );
}
