"use client";

import { useEffect, useReducer } from "react";
import { getEnabledPaymentMethods } from "@/lib/api-client";
import type { EnabledPaymentMethod } from "@/lib/api-types";

type State = { methods: EnabledPaymentMethod[]; loading: boolean };

export function useEnabledPaymentMethods() {
  const [state, dispatch] = useReducer(
    (_: State, methods: EnabledPaymentMethod[]): State => ({ methods, loading: false }),
    { methods: [], loading: true },
  );

  useEffect(() => {
    let cancelled = false;
    getEnabledPaymentMethods()
      .then(({ methods }) => { if (!cancelled) dispatch(methods); })
      // On failure fall back to all three so checkout is never blocked.
      .catch(() => {
        if (!cancelled) {
          dispatch([
            { method: "CASH", upiId: null },
            { method: "CARD", upiId: null },
            { method: "UPI", upiId: null },
          ]);
        }
      });
    return () => { cancelled = true; };
  }, []);

  return state;
}
