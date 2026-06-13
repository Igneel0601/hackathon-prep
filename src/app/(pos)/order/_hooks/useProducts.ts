"use client";

import { useEffect, useReducer } from "react";
import { use$ } from "@legendapp/state/react";
import { getProducts } from "@/lib/api-client";
import type { Category, Product } from "@/lib/api-types";
import { OFFLINE_ENABLED } from "@/lib/offline/flag";
import { products$ } from "@/lib/offline/store";

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

// Online: fetch (optionally category-filtered) directly — current behavior.
function useProductsOnline(categoryId?: string) {
  const [state, dispatch] = useReducer(reducer, { categories: [], products: [], loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    dispatch({ type: "loading" });
    getProducts(categoryId)
      .then((data) => {
        if (!cancelled) dispatch({ type: "success", categories: data.categories, products: data.products });
      })
      .catch((e: Error) => {
        if (!cancelled) dispatch({ type: "error", message: e.message });
      });
    return () => { cancelled = true; };
  }, [categoryId]);

  return state;
}

// Offline-mode: read the full menu from the Legend-State cache (products$ caches
// ALL products + categories), then filter by category client-side — you can't
// fetch per-category with no network. Serves IndexedDB offline, refreshes online.
function useProductsOffline(categoryId?: string): State {
  const data = use$(products$);
  const all = data?.products ?? [];
  return {
    categories: data?.categories ?? [],
    products: categoryId ? all.filter((p) => p.categoryId === categoryId) : all,
    loading: data === undefined,
    error: null,
  };
}

export const useProducts = OFFLINE_ENABLED ? useProductsOffline : useProductsOnline;
