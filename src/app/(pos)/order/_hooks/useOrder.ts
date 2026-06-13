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
      const lineItems = items.map((i) => ({ productId: i.productId, qty: i.qty }));
      let order: Order;
      if (existing) {
        // Once an order is sent to the kitchen its items are frozen (server 409s
        // on item edits). Only sync items while still editable; discount always
        // goes through — so paying an already-cooking order isn't blocked.
        const patch =
          existing.kitchenStatus === "NONE"
            ? { items: lineItems, ...(discount ? { discount } : {}) }
            : { ...(discount ? { discount } : {}) };
        order = await updateOrder(existing.id, patch);
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

  async function sendKitchen(orderId: string) {
    try {
      await sendToKitchen(orderId, "send");
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
