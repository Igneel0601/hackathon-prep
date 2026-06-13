import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TicketCard } from '@/app/kds/_components/TicketCard';
import * as apiClient from '@/lib/api-client';
import type { KitchenStatus } from '@/lib/api-types';

vi.mock('@/lib/api-client', () => ({
  sendToKitchen: vi.fn(),
}));

const BASE = {
  orderId: 'order-99',
  number: 42,
  items: [
    { name: 'Margherita Pizza', qty: 2 },
    { name: 'Veg Sandwich', qty: 1 },
  ],
  onAdvance: vi.fn(),
};

function renderCard(status: KitchenStatus) {
  return render(<TicketCard {...BASE} status={status} />);
}

describe('TicketCard — rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.sendToKitchen).mockResolvedValue({} as never);
  });

  it('displays order number and all items with quantities', () => {
    renderCard('TO_COOK');
    expect(screen.getByText('#42')).toBeInTheDocument();
    expect(screen.getByText('Margherita Pizza')).toBeInTheDocument();
    expect(screen.getByText('Veg Sandwich')).toBeInTheDocument();
    expect(screen.getByText('×2')).toBeInTheDocument();
    expect(screen.getByText('×1')).toBeInTheDocument();
  });

  it('TO_COOK: shows "To Cook" badge and "Start Preparing" button', () => {
    renderCard('TO_COOK');
    expect(screen.getByText('To Cook')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start preparing/i })).toBeInTheDocument();
  });

  it('PREPARING: shows "Preparing" badge and "Mark Complete" button', () => {
    renderCard('PREPARING');
    expect(screen.getByText('Preparing')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mark complete/i })).toBeInTheDocument();
  });

  it('COMPLETED: shows "Completed" badge, "Done" text, no action button', () => {
    renderCard('COMPLETED');
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('NONE: shows "None" badge, no action button', () => {
    renderCard('NONE');
    expect(screen.getByText('None')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('TicketCard — advancing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.sendToKitchen).mockResolvedValue({} as never);
  });

  it('calls sendToKitchen("advance") and then onAdvance on success', async () => {
    const user = userEvent.setup();
    renderCard('TO_COOK');
    await user.click(screen.getByRole('button', { name: /start preparing/i }));

    expect(apiClient.sendToKitchen).toHaveBeenCalledWith('order-99', 'advance');
    await waitFor(() => expect(BASE.onAdvance).toHaveBeenCalledTimes(1));
  });

  it('shows "Updating…" and disables button while in-flight', async () => {
    let resolve: () => void;
    vi.mocked(apiClient.sendToKitchen).mockReturnValue(
      new Promise((r) => { resolve = () => r({} as never); }),
    );

    const user = userEvent.setup();
    renderCard('TO_COOK');
    await user.click(screen.getByRole('button', { name: /start preparing/i }));

    const btn = screen.getByRole('button', { name: /updating/i });
    expect(btn).toBeDisabled();

    resolve!();
    await waitFor(() => expect(screen.getByRole('button', { name: /start preparing/i })).not.toBeDisabled());
  });

  it('does not call onAdvance when sendToKitchen rejects', async () => {
    vi.mocked(apiClient.sendToKitchen).mockRejectedValue(new Error('timeout'));
    const user = userEvent.setup();
    renderCard('PREPARING');
    await user.click(screen.getByRole('button', { name: /mark complete/i }));

    await waitFor(() => expect(apiClient.sendToKitchen).toHaveBeenCalled());
    expect(BASE.onAdvance).not.toHaveBeenCalled();
  });

  it('re-enables button after a failed advance so the user can retry', async () => {
    vi.mocked(apiClient.sendToKitchen).mockRejectedValue(new Error('fail'));
    const user = userEvent.setup();
    renderCard('TO_COOK');
    await user.click(screen.getByRole('button', { name: /start preparing/i }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /start preparing/i })).not.toBeDisabled(),
    );
  });

  it('ignores rapid double-clicks — sendToKitchen called exactly once', async () => {
    // Keep the first call pending so the button stays disabled for the second click
    let resolve: () => void;
    vi.mocked(apiClient.sendToKitchen).mockReturnValue(
      new Promise((r) => { resolve = () => r({} as never); }),
    );

    const user = userEvent.setup();
    renderCard('TO_COOK');
    const btn = screen.getByRole('button', { name: /start preparing/i });

    // First click — sets advancing=true, button becomes disabled
    await user.click(btn);
    // Second click on the now-disabled button — should be a no-op
    await user.click(btn);

    // Resolve the in-flight call
    resolve!();
    await waitFor(() => expect(BASE.onAdvance).toHaveBeenCalledTimes(1));
    expect(apiClient.sendToKitchen).toHaveBeenCalledTimes(1);
  });
});
