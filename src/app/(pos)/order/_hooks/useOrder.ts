"use client";

import { useReducer } from "react";
import { createOrder, updateOrder, sendToKitchen, payOrder } from "@/lib/api-client";
import type { Order, PaymentResponse } from "@/lib/api-types";
import type { CartItem } from "./useCart";

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

export function useOrder() {
  const [state, dispatch] = useReducer(reducer, { phase: "idle" });

  // Adopt an existing DRAFT order fetched for the table (resume).
  function resumeExisting(order: Order) {
    dispatch({ type: "ordered", order });
  }

  // Create the order if none exists for this table yet, otherwise PATCH the
  // existing draft. One draft per table → no duplicates, current items synced.
  async function ensureOrder(tableId: string, items: CartItem[], discount?: number) {
    const existing = state.phase === "ordered" ? state.order : null;
    dispatch({ type: "submitting" });
    try {
      // `items` here is the un-fired (round 0) set. PATCH replaces only those —
      // the server keeps fired rounds frozen — so this is always safe to send.
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
