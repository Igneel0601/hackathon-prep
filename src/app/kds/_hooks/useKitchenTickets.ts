"use client";

import { useEffect, useReducer } from "react";
import { getKitchenTickets, sendToKitchen } from "@/lib/api-client";
import type { KitchenTicket } from "@/lib/api-types";

type State =
  | { phase: "loading"; tickets: KitchenTicket[] }
  | { phase: "ready"; tickets: KitchenTicket[] }
  | { phase: "error"; tickets: KitchenTicket[]; message: string };

type Action =
  | { type: "fetched"; tickets: KitchenTicket[] }
  | { type: "error"; message: string }
  | { type: "optimistic"; orderId: string; nextStatus: KitchenTicket["kitchenStatus"] };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "fetched":
      return { phase: "ready", tickets: action.tickets };
    case "error":
      return { phase: "error", tickets: state.tickets, message: action.message };
    case "optimistic": {
      const tickets = state.tickets
        .map((t) =>
          t.orderId === action.orderId ? { ...t, kitchenStatus: action.nextStatus } : t,
        )
        .filter((t) => t.kitchenStatus !== "COMPLETED");
      return { ...state, tickets };
    }
  }
}

const NEXT_STATUS: Record<string, KitchenTicket["kitchenStatus"]> = {
  TO_COOK: "PREPARING",
  PREPARING: "COMPLETED",
};

export function useKitchenTickets() {
  const [state, dispatch] = useReducer(reducer, { phase: "loading", tickets: [] });

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const { tickets } = await getKitchenTickets();
        if (!cancelled) dispatch({ type: "fetched", tickets });
      } catch (e: unknown) {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : "Failed to load tickets";
          dispatch({ type: "error", message });
        }
      }
    }

    poll();
    const id = setInterval(poll, 3000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  async function advance(orderId: string, currentStatus: KitchenTicket["kitchenStatus"]) {
    const nextStatus = NEXT_STATUS[currentStatus];
    if (!nextStatus) return;
    dispatch({ type: "optimistic", orderId, nextStatus });
    try {
      await sendToKitchen(orderId, "advance");
    } catch {
      // next poll will correct state
    }
  }

  return { ...state, advance };
}
