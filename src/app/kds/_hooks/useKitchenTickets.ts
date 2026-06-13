"use client";

import { useEffect, useReducer } from "react";
import { getKitchenTickets, sendToKitchen } from "@/lib/api-client";
import type { KitchenTicket } from "@/lib/api-types";

type State =
  | { phase: "loading"; tickets: KitchenTicket[]; completed: KitchenTicket[] }
  | { phase: "ready"; tickets: KitchenTicket[]; completed: KitchenTicket[] }
  | { phase: "error"; tickets: KitchenTicket[]; completed: KitchenTicket[]; message: string };

type Action =
  | { type: "fetched"; tickets: KitchenTicket[]; completed: KitchenTicket[] }
  | { type: "error"; message: string }
  | { type: "optimistic"; orderId: string; round: number; nextStatus: KitchenTicket["kitchenStatus"] };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "fetched":
      return { phase: "ready", tickets: action.tickets, completed: action.completed };
    case "error":
      return { phase: "error", tickets: state.tickets, completed: state.completed, message: action.message };
    case "optimistic": {
      const tickets = state.tickets
        .map((t) =>
          t.orderId === action.orderId && t.round === action.round
            ? { ...t, kitchenStatus: action.nextStatus }
            : t,
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
  const [state, dispatch] = useReducer(reducer, { phase: "loading", tickets: [], completed: [] });

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const [active, done] = await Promise.all([
          getKitchenTickets(),
          getKitchenTickets("COMPLETED"),
        ]);
        if (!cancelled) {
          // Show only the most recent completed tickets, newest first.
          const completed = [...done.tickets]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 8);
          dispatch({ type: "fetched", tickets: active.tickets, completed });
        }
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

  async function advance(
    orderId: string,
    round: number,
    currentStatus: KitchenTicket["kitchenStatus"],
  ) {
    const nextStatus = NEXT_STATUS[currentStatus];
    if (!nextStatus) return;
    dispatch({ type: "optimistic", orderId, round, nextStatus });
    try {
      await sendToKitchen(orderId, "advance", round);
    } catch (e: unknown) {
      // Surface the failure; the next poll (≤3s) reconciles the real state.
      const message = e instanceof Error ? e.message : "Couldn't update ticket";
      dispatch({ type: "error", message });
    }
  }

  return { ...state, advance };
}
