"use client";

import { useReducer } from "react";
import { createOrder, updateOrder, sendToKitchen, payOrder } from "@/lib/api-client";
import type { Order, OrderItem, PaymentResponse } from "@/lib/api-types";
import type { CartItem } from "./useCart";
import { OFFLINE_ENABLED } from "@/lib/offline/flag";
import { orders$ } from "@/lib/offline/store";

type State =
  | { phase: "idle" }
  | { phase: "submitting" }
  | { phase: "ordered"; order: Order }
  | { phase: "paid"; result: PaymentResponse }
  | { phase: "error"; message: string };

type Action =
  | { type: "submitting" }
  | { type: "ordered"; order: Order }
  | { type: "paid"; result: PaymentResponse }
  | { type: "error"; message: string }
  | { type: "reset" };

function reducer(_: State, action: Action): State {
  switch (action.type) {
    case "submitting": return { phase: "submitting" };
    case "ordered":    return { phase: "ordered", order: action.order };
    case "paid":       return { phase: "paid", result: action.result };
    case "error":      return { phase: "error", message: action.message };
    case "reset":      return { phase: "idle" };
  }
}

// Build a local Order snapshot from the (round-0) cart for the offline store.
// number=0 is the "not yet assigned" placeholder; the server fills the real
// number when the queued create syncs. Offline orders are round-0 only (firing
// rounds happens online), so cart items map straight to the order items.
function buildLocalOrder(
  id: string,
  tableId: string,
  items: CartItem[],
  totals: { subtotal: string; tax: string; discount: string; total: string },
  existing: Order | null,
): Order {
  const orderItems: OrderItem[] = items.map((i) => ({
    id: `${id}-${i.productId}`,
    productId: i.productId,
    name: i.name,
    unitPrice: i.unitPrice,
    qty: i.qty,
    lineTotal: (parseFloat(i.unitPrice) * i.qty).toFixed(2),
    round: i.round,
    kitchenStatus: "NONE",
  }));
  const now = new Date().toISOString();
  return {
    id,
    number: existing?.number ?? 0,
    status: existing?.status ?? "DRAFT",
    kitchenStatus: existing?.kitchenStatus ?? "NONE",
    subtotal: totals.subtotal,
    tax: totals.tax,
    discount: totals.discount,
    total: totals.total,
    tableId,
    customerId: existing?.customerId ?? null,
    sessionId: existing?.sessionId ?? "",
    items: orderItems,
    customer: existing?.customer ?? null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

export function useOrder() {
  const [state, dispatch] = useReducer(reducer, { phase: "idle" });

  // Adopt an existing DRAFT order fetched for the table (resume).
  function resumeExisting(order: Order) {
    dispatch({ type: "ordered", order });
  }

  // Create the order if none exists for this table yet, otherwise PATCH the
  // existing draft. One draft per table → no duplicates, current items synced.
  async function ensureOrder(
    tableId: string,
    items: CartItem[],
    discount?: number,
    totals?: { subtotal: string; tax: string; discount: string; total: string },
  ) {
    const existing = state.phase === "ordered" ? state.order : null;
    dispatch({ type: "submitting" });

    // Offline-mode path: write through the Legend-State store. It persists to
    // IndexedDB and QUEUES the create/update — flushing to the server (via the
    // api-client functions wired in store.ts) the moment the network returns.
    // The server's idempotency guards make the at-least-once flush safe.
    if (OFFLINE_ENABLED) {
      try {
        const id = existing?.id ?? crypto.randomUUID();
        const local = buildLocalOrder(
          id,
          tableId,
          items,
          totals ?? { subtotal: "0", tax: "0", discount: discount ? String(discount) : "0", total: "0" },
          existing,
        );
        // set() on a new id → store's create(); assign on an existing id → update().
        orders$[id].set(local);
        dispatch({ type: "ordered", order: local });
        return local;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to place order";
        dispatch({ type: "error", message: msg });
        return null;
      }
    }

    // Online path (unchanged): call the API directly.
    try {
      const lineItems = items.map((i) => ({ productId: i.productId, qty: i.qty }));
      let order: Order;
      if (existing) {
        order = await updateOrder(existing.id, {
          items: lineItems,
          ...(discount ? { discount } : {}),
        });
      } else {
        order = await createOrder({
          tableId,
          items: lineItems,
          ...(discount ? { discount } : {}),
        });
      }
      dispatch({ type: "ordered", order });
      return order;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to place order";
      dispatch({ type: "error", message: msg });
      return null;
    }
  }

  async function sendKitchen(order: Order) {
    try {
      const summary = await sendToKitchen(order.id, "send");
      // Reflect the new kitchen/payment state so the UI can switch to checkout.
      dispatch({
        type: "ordered",
        order: { ...order, status: summary.status, kitchenStatus: summary.kitchenStatus },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to send to kitchen";
      dispatch({ type: "error", message: msg });
    }
  }

  async function pay(
    orderId: string,
    opts: { method: "CASH" | "CARD" | "UPI"; amountReceived?: number; reference?: string },
  ) {
    dispatch({ type: "submitting" });
    try {
      const result = await payOrder(orderId, opts);
      dispatch({ type: "paid", result });
      return result;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Payment failed";
      dispatch({ type: "error", message: msg });
      return null;
    }
  }

  return {
    state,
    ensureOrder,
    resumeExisting,
    sendKitchen,
    pay,
    reset: () => dispatch({ type: "reset" }),
  };
}
