"use client";

import { useEffect, useReducer, useState } from "react";
import {
  adminListUsers,
  adminCreateUser,
  adminUpdateUser,
  adminSetUserPassword,
  adminArchiveUser,
  adminDeleteUser,
} from "@/lib/api-client";
import type { AdminUser, CreateUserBody, UpdateUserBody } from "@/lib/api-types";

const PAGE_SIZE = 50;

type State = { data: AdminUser[]; total: number; loading: boolean; error: string | null };
type Action =
  | { type: "loading" }
  | { type: "success"; data: AdminUser[]; total: number }
  | { type: "error"; message: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "loading": return { ...state, loading: true, error: null };
    case "success": return { data: action.data, total: action.total, loading: false, error: null };
    case "error": return { ...state, loading: false, error: action.message };
  }
}

export function useAdminUsers() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [state, dispatch] = useReducer(reducer, { data: [], total: 0, loading: true, error: null });
  const [tick, refetch] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    let cancelled = false;
    dispatch({ type: "loading" });
    adminListUsers({ q: q || undefined, page, pageSize: PAGE_SIZE })
      .then((res) => { if (!cancelled) dispatch({ type: "success", data: res.data, total: res.total }); })
      .catch((e: unknown) => {
        if (!cancelled) dispatch({ type: "error", message: e instanceof Error ? e.message : "Failed to load" });
      });
    return () => { cancelled = true; };
  }, [q, page, tick]);

  const after = <T>(p: Promise<T>) => p.then((r) => { refetch(); return r; });

  return {
    ...state,
    q,
    page,
    pageSize: PAGE_SIZE,
    setQ,
    setPage,
    refetch,
    create: (body: CreateUserBody) => after(adminCreateUser(body)),
    update: (id: string, body: UpdateUserBody) => after(adminUpdateUser(id, body)),
    setPassword: (id: string, password: string) => adminSetUserPassword(id, password),
    archive: (id: string, active: boolean) => after(adminArchiveUser(id, active)),
    remove: (id: string) => after(adminDeleteUser(id)),
  };
}
