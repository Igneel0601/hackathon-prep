"use client";

import { useEffect, useReducer } from "react";
import { adminGetPaymentMethods, adminUpdatePaymentMethod } from "@/lib/api-client";
import type { PaymentMethodSettingDTO, UpdatePaymentMethodBody } from "@/lib/api-types";

type State = { settings: PaymentMethodSettingDTO[]; loading: boolean; error: string | null };
type Action =
  | { type: "loading" }
  | { type: "success"; settings: PaymentMethodSettingDTO[] }
  | { type: "error"; message: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "loading": return { ...state, loading: true, error: null };
    case "success": return { settings: action.settings, loading: false, error: null };
    case "error": return { ...state, loading: false, error: action.message };
  }
}

export function useAdminPaymentMethods() {
  const [state, dispatch] = useReducer(reducer, { settings: [], loading: true, error: null });
  const [tick, refetch] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    let cancelled = false;
    dispatch({ type: "loading" });
    adminGetPaymentMethods()
      .then(({ settings }) => { if (!cancelled) dispatch({ type: "success", settings }); })
      .catch((e: unknown) => {
        if (!cancelled) dispatch({ type: "error", message: e instanceof Error ? e.message : "Failed to load" });
      });
    return () => { cancelled = true; };
  }, [tick]);

  return {
    ...state,
    refetch,
    // Returns the updated row so callers can surface errors (e.g. last-method / UPI-id rules).
    update: (method: string, body: UpdatePaymentMethodBody) =>
      adminUpdatePaymentMethod(method, body).then((row) => {
        refetch();
        return row;
      }),
  };
}
