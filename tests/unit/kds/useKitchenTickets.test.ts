import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKitchenTickets } from '@/app/kds/_hooks/useKitchenTickets';
import * as apiClient from '@/lib/api-client';
import type { KitchenTicket } from '@/lib/api-types';

vi.mock('@/lib/api-client', () => ({
  getKitchenTickets: vi.fn(),
  sendToKitchen: vi.fn(),
}));

const ticket = (over: Partial<KitchenTicket> = {}): KitchenTicket => ({
  orderId: 'o1',
  number: 1,
  kitchenStatus: 'TO_COOK',
  items: [{ productId: 'p1', name: 'Pizza', qty: 1 }],
  createdAt: new Date().toISOString(),
  ...over,
});

// Flush microtasks without advancing timers (0ms = just drain the promise queue)
async function drainMicrotasks() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
}

// Advance the poll clock by one interval and drain resulting promises
async function advancePoll(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

describe('useKitchenTickets', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(apiClient.getKitchenTickets).mockResolvedValue({ tickets: [ticket()] });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('starts in loading state with empty tickets', () => {
    const { result } = renderHook(() => useKitchenTickets());
    expect(result.current.loading).toBe(true);
    expect(result.current.tickets).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('resolves to tickets after successful fetch', async () => {
    const { result } = renderHook(() => useKitchenTickets());
    await drainMicrotasks();
    expect(result.current.loading).toBe(false);
    expect(result.current.tickets).toHaveLength(1);
    expect(result.current.tickets[0].orderId).toBe('o1');
    expect(result.current.error).toBeNull();
  });

  it('sets error string when fetch throws', async () => {
    vi.mocked(apiClient.getKitchenTickets).mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useKitchenTickets());
    await drainMicrotasks();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Network error');
    expect(result.current.tickets).toEqual([]);
  });

  it('uses fallback message for non-Error throws', async () => {
    vi.mocked(apiClient.getKitchenTickets).mockRejectedValue('oops');
    const { result } = renderHook(() => useKitchenTickets());
    await drainMicrotasks();
    expect(result.current.error).toBe('Failed to load tickets');
  });

  it('polls at the specified interval', async () => {
    const INTERVAL = 1000;
    renderHook(() => useKitchenTickets(INTERVAL));

    await drainMicrotasks(); // initial fetch
    expect(apiClient.getKitchenTickets).toHaveBeenCalledTimes(1);

    await advancePoll(INTERVAL); // 2nd poll
    expect(apiClient.getKitchenTickets).toHaveBeenCalledTimes(2);

    await advancePoll(INTERVAL); // 3rd poll
    expect(apiClient.getKitchenTickets).toHaveBeenCalledTimes(3);
  });

  it('clears poll interval on unmount — no further calls after unmount', async () => {
    const INTERVAL = 500;
    const { unmount } = renderHook(() => useKitchenTickets(INTERVAL));
    await drainMicrotasks();
    unmount();

    // Advance well past the interval
    await act(async () => { vi.advanceTimersByTime(2000); });

    // Only the single call before unmount
    expect(apiClient.getKitchenTickets).toHaveBeenCalledTimes(1);
  });

  it('refetch triggers an immediate additional fetch', async () => {
    const { result } = renderHook(() => useKitchenTickets(5000));
    await drainMicrotasks();
    expect(apiClient.getKitchenTickets).toHaveBeenCalledTimes(1);

    await act(async () => { await result.current.refetch(); });
    expect(apiClient.getKitchenTickets).toHaveBeenCalledTimes(2);
  });

  it('clears error on next successful poll', async () => {
    const INTERVAL = 1000;
    vi.mocked(apiClient.getKitchenTickets)
      .mockRejectedValueOnce(new Error('transient'))
      .mockResolvedValue({ tickets: [ticket()] });

    const { result } = renderHook(() => useKitchenTickets(INTERVAL));
    await drainMicrotasks();
    expect(result.current.error).toBe('transient');

    await advancePoll(INTERVAL);
    expect(result.current.error).toBeNull();
    expect(result.current.tickets).toHaveLength(1);
  });

  it('updates tickets list when poll returns new data', async () => {
    const INTERVAL = 1000;
    vi.mocked(apiClient.getKitchenTickets)
      .mockResolvedValueOnce({ tickets: [ticket({ orderId: 'o1' })] })
      .mockResolvedValue({ tickets: [ticket({ orderId: 'o1' }), ticket({ orderId: 'o2', number: 2 })] });

    const { result } = renderHook(() => useKitchenTickets(INTERVAL));
    await drainMicrotasks();
    expect(result.current.tickets).toHaveLength(1);

    await advancePoll(INTERVAL);
    expect(result.current.tickets).toHaveLength(2);
  });
});
