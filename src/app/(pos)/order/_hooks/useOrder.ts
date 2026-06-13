"use client";

import { useReducer } from "react";
import { createOrder, sendToKitchen, payOrder } from "@/lib/api-client";
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

  async function placeOrder(tableId: string, items: CartItem[], discount?: number) {
    dispatch({ type: "submitting" });
    try {
      const order = await createOrder({
        tableId,
        items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
        ...(discount ? { discount } : {}),
      });
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

  return { state, placeOrder, sendKitchen, pay, reset: () => dispatch({ type: "reset" }) };
}
