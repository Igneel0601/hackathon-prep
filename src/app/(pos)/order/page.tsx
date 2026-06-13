"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

// Placeholder Order View — the floor picker routes here with ?tableId=.
// Product grid + cart + payment land in the next order-view PRs.
function OrderViewInner() {
  const tableId = useSearchParams().get("tableId");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-gray-50 p-8 text-center">
      <h1 className="text-2xl font-bold text-gray-900">Order View</h1>
      <p className="text-gray-600">
        Table: <span className="font-mono">{tableId ?? "—"}</span>
      </p>
      <p className="text-sm text-gray-400">Product grid + cart coming next.</p>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense>
      <OrderViewInner />
    </Suspense>
  );
}
