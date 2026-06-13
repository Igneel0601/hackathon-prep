"use client";

import { useEffect, useReducer } from "react";
import {
  adminListFloors,
  adminCreateFloor,
  adminUpdateFloor,
  adminDeleteFloor,
  adminCreateTable,
  adminUpdateTable,
  adminDeleteTable,
} from "@/lib/api-client";
import type { AdminFloor, CreateTableBody, UpdateTableBody } from "@/lib/api-types";

type State = { floors: AdminFloor[]; loading: boolean; error: string | null };
type Action =
  | { type: "loading" }
  | { type: "success"; floors: AdminFloor[] }
  | { type: "error"; message: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "loading": return { ...state, loading: true, error: null };
    case "success": return { floors: action.floors, loading: false, error: null };
    case "error": return { ...state, loading: false, error: action.message };
  }
}

export function useAdminFloors() {
  const [state, dispatch] = useReducer(reducer, { floors: [], loading: true, error: null });
  const [tick, refetch] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    let cancelled = false;
    dispatch({ type: "loading" });
    adminListFloors()
      .then(({ floors }) => { if (!cancelled) dispatch({ type: "success", floors }); })
      .catch((e: unknown) => {
        if (!cancelled) dispatch({ type: "error", message: e instanceof Error ? e.message : "Failed to load" });
      });
    return () => { cancelled = true; };
  }, [tick]);

  const after = <T>(p: Promise<T>) => p.then((r) => { refetch(); return r; });

  return {
    ...state,
    refetch,
    createFloor: (name: string) => after(adminCreateFloor(name)),
    updateFloor: (id: string, name: string) => after(adminUpdateFloor(id, name)),
    deleteFloor: (id: string) => after(adminDeleteFloor(id)),
    createTable: (body: CreateTableBody) => after(adminCreateTable(body)),
    updateTable: (id: string, body: UpdateTableBody) => after(adminUpdateTable(id, body)),
    deleteTable: (id: string) => after(adminDeleteTable(id)),
  };
}
