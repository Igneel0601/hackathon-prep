"use client";

import { useEffect, useReducer, useState } from "react";
import {
  adminListProducts,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
} from "@/lib/api-client";
import type { AdminProduct, CreateProductBody, UpdateProductBody } from "@/lib/api-types";

const PAGE_SIZE = 50;

type State = { data: AdminProduct[]; total: number; loading: boolean; error: string | null };
type Action =
  | { type: "loading" }
  | { type: "success"; data: AdminProduct[]; total: number }
  | { type: "error"; message: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "loading": return { ...state, loading: true, error: null };
    case "success": return { data: action.data, total: action.total, loading: false, error: null };
    case "error": return { ...state, loading: false, error: action.message };
  }
}

export function useAdminProducts() {
  // Filter state set from event handlers (allowed); data fetched via reducer.
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [state, dispatch] = useReducer(reducer, { data: [], total: 0, loading: true, error: null });
  const [tick, refetch] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    let cancelled = false;
    dispatch({ type: "loading" });
    adminListProducts({ q: q || undefined, categoryId: categoryId || undefined, page, pageSize: PAGE_SIZE })
      .then((res) => { if (!cancelled) dispatch({ type: "success", data: res.data, total: res.total }); })
      .catch((e: unknown) => {
        if (!cancelled) {
          dispatch({ type: "error", message: e instanceof Error ? e.message : "Failed to load products" });
        }
      });
    return () => { cancelled = true; };
  }, [q, categoryId, page, tick]);

  return {
    ...state,
    q,
    categoryId,
    page,
    pageSize: PAGE_SIZE,
    setQ,
    setCategoryId,
    setPage,
    refetch,
    create: (body: CreateProductBody) => adminCreateProduct(body).then(() => refetch()),
    update: (id: string, body: UpdateProductBody) => adminUpdateProduct(id, body).then(() => refetch()),
    remove: (id: string) => adminDeleteProduct(id).then(() => refetch()),
  };
}
