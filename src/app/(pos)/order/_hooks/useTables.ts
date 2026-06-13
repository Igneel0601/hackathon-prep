"use client";

import { useEffect, useReducer } from "react";
import { getTables } from "@/lib/api-client";
import type { Floor } from "@/lib/api-types";

type State = { floors: Floor[]; loading: boolean; error: string | null };
type Action =
  | { type: "loading" }
  | { type: "success"; floors: Floor[] }
  | { type: "error"; message: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "loading": return { ...state, loading: true, error: null };
    case "success": return { floors: action.floors, loading: false, error: null };
    case "error":   return { ...state, loading: false, error: action.message };
  }
}

export function useTables() {
  const [state, dispatch] = useReducer(reducer, { floors: [], loading: true, error: null });
  const [tick, refetch] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    let cancelled = false;
    dispatch({ type: "loading" });
    getTables()
      .then((data) => { if (!cancelled) dispatch({ type: "success", floors: data.floors }); })
      .catch((e: Error) => { if (!cancelled) dispatch({ type: "error", message: e.message }); });
    return () => { cancelled = true; };
  }, [tick]);

  return { ...state, refetch };
}
