"use client";

import { useEffect, useReducer } from "react";
import { getSelfCheckoutMenu } from "@/lib/api-client";
import type { Category, Product } from "@/lib/api-types";

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

export function useMenu() {
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
