"use client";

import { useEffect, useReducer } from "react";
import { use$ } from "@legendapp/state/react";
import { getSelfCheckoutMenu } from "@/lib/api-client";
import type { Category, Product } from "@/lib/api-types";
import { OFFLINE_ENABLED } from "@/lib/offline/flag";
import { kioskMenu$ } from "@/lib/offline/store";

type State = { categories: Category[]; products: Product[]; loading: boolean; error: string | null };
type Action =
  | { type: "loading" }
  | { type: "success"; categories: Category[]; products: Product[] }
  | { type: "error"; message: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "loading": return { ...state, loading: true, error: null };
    case "success": return { categories: action.categories, products: action.products, loading: false, error: null };
    case "error":   return { ...state, loading: false, error: action.message };
  }
}

// Online: fetch directly. Offline-mode: read the Legend-State kiosk cache (seeded
// online, served from IndexedDB when the network drops).
function useMenuOnline() {
  const [state, dispatch] = useReducer(reducer, { categories: [], products: [], loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    dispatch({ type: "loading" });
    getSelfCheckoutMenu()
      .then((data) => {
        if (!cancelled) dispatch({ type: "success", categories: data.categories, products: data.products });
      })
      .catch((e: Error) => {
        if (!cancelled) dispatch({ type: "error", message: e.message });
      });
    return () => { cancelled = true; };
  }, []);

  return state;
}

function useMenuOffline(): State {
  const data = use$(kioskMenu$);
  return {
    categories: data?.categories ?? [],
    products: data?.products ?? [],
    loading: !data,
    error: null,
  };
}

export const useMenu = OFFLINE_ENABLED ? useMenuOffline : useMenuOnline;
