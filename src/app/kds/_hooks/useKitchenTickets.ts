'use client';

import { useState, useEffect, useCallback } from 'react';
import { getKitchenTickets } from '@/lib/api-client';
import type { KitchenTicket } from '@/lib/api-types';

export function useKitchenTickets(intervalMs = 2500) {
  const [tickets, setTickets] = useState<KitchenTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      const data = await getKitchenTickets();
      setTickets(data.tickets);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    const id = setInterval(fetch, intervalMs);
    return () => clearInterval(id);
  }, [fetch, intervalMs]);

  return { tickets, loading, error, refetch: fetch };
}
