"use client";

import { useEffect, useReducer } from "react";
import { use$ } from "@legendapp/state/react";
import { getSelfCheckoutTables } from "@/lib/api-client";
import type { Floor } from "@/lib/api-types";
import { OFFLINE_ENABLED } from "@/lib/offline/flag";
import { kioskTables$ } from "@/lib/offline/store";

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

function useTablesOnline() {
  const [state, dispatch] = useReducer(reducer, { floors: [], loading: true, error: null });
  const [tick, refetch] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    let cancelled = false;
    dispatch({ type: "loading" });
    getSelfCheckoutTables()
      .then((data) => { if (!cancelled) dispatch({ type: "success", floors: data.floors }); })
      .catch((e: Error) => { if (!cancelled) dispatch({ type: "error", message: e.message }); });
    return () => { cancelled = true; };
  }, [tick]);

  return { ...state, refetch };
}

// Offline-mode: read the cached floors (seeded online). Occupancy is a snapshot —
// it may be stale, which the place-order flush handles via a 409 → "see staff".
function useTablesOffline() {
  const data = use$(kioskTables$);
  return {
    floors: data?.floors ?? [],
    loading: !data,
    error: null as string | null,
    refetch: () => {}, // no-op offline — there's nothing fresher to fetch
  };
}

export const useTables = OFFLINE_ENABLED ? useTablesOffline : useTablesOnline;
