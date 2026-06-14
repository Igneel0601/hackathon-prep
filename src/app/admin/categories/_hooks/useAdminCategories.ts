"use client";

import { useEffect, useReducer } from "react";
import {
  adminListCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
} from "@/lib/api-client";
import type { AdminCategory, CategoryBody } from "@/lib/api-types";

type State = { categories: AdminCategory[]; loading: boolean; error: string | null };
type Action =
  | { type: "loading" }
  | { type: "success"; categories: AdminCategory[] }
  | { type: "error"; message: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "loading": return { ...state, loading: true, error: null };
    case "success": return { categories: action.categories, loading: false, error: null };
    case "error": return { ...state, loading: false, error: action.message };
  }
}

export function useAdminCategories() {
  const [state, dispatch] = useReducer(reducer, { categories: [], loading: true, error: null });
  const [tick, refetch] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    let cancelled = false;
    dispatch({ type: "loading" });
    adminListCategories()
      .then(({ categories }) => { if (!cancelled) dispatch({ type: "success", categories }); })
      .catch((e: unknown) => {
        if (!cancelled) {
          dispatch({ type: "error", message: e instanceof Error ? e.message : "Failed to load categories" });
        }
      });
    return () => { cancelled = true; };
  }, [tick]);

  return {
    ...state,
    refetch,
    create: (body: CategoryBody) => adminCreateCategory(body).then(() => refetch()),
    update: (id: string, body: CategoryBody) => adminUpdateCategory(id, body).then(() => refetch()),
    remove: (id: string) => adminDeleteCategory(id).then(() => refetch()),
  };
}
