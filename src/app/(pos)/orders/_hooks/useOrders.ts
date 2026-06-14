"use client";

import { useEffect, useReducer } from "react";
import { getOrders } from "@/lib/api-client";
import type { Order } from "@/lib/api-types";

type State =
  | { phase: "loading" }
  | { phase: "ready"; orders: Order[] }
  | { phase: "error"; message: string };

type Action =
  | { type: "loading" }
  | { type: "fetched"; orders: Order[] }
  | { type: "error"; message: string };

function reducer(_: State, action: Action): State {
  switch (action.type) {
    case "loading": return { phase: "loading" };
    case "fetched": return { phase: "ready", orders: action.orders };
    case "error":   return { phase: "error", message: action.message };
  }
}

export function useOrders() {
  const [state, dispatch] = useReducer(reducer, { phase: "loading" });
  const [tick, refetch] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    let cancelled = false;
    dispatch({ type: "loading" });
    getOrders()
      .then((orders) => { if (!cancelled) dispatch({ type: "fetched", orders }); })
      .catch((e: unknown) => {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : "Failed to load orders";
          dispatch({ type: "error", message });
        }
      });
    return () => { cancelled = true; };
  }, [tick]);

  return { ...state, refetch };
}
