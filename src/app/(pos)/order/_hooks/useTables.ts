"use client";

import { useEffect, useState } from "react";
import { getTables } from "@/lib/api-client";
import type { Floor } from "@/lib/api-types";

interface UseTablesResult {
  floors: Floor[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTables(): UseTablesResult {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getTables()
      .then((data) => {
        if (!cancelled) setFloors(data.floors);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tick]);

  return { floors, loading, error, refetch: () => setTick((t) => t + 1) };
}
