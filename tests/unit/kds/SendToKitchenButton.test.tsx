import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SendToKitchenButton } from '@/app/(pos)/orders/_components/SendToKitchenButton';
import * as apiClient from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  sendToKitchen: vi.fn(),
}));

const onSuccess = vi.fn();

describe('SendToKitchenButton — NONE status (actionable)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.sendToKitchen).mockResolvedValue({} as never);
  });

  it('renders "Send to Kitchen" button', () => {
    render(<SendToKitchenButton orderId="o1" kitchenStatus="NONE" onSuccess={onSuccess} />);
    expect(screen.getByRole('button', { name: /send to kitchen/i })).toBeInTheDocument();
  });

  it('calls sendToKitchen with "send" action and correct orderId', async () => {
    const user = userEvent.setup();
    render(<SendToKitchenButton orderId="order-xyz" kitchenStatus="NONE" onSuccess={onSuccess} />);
    await user.click(screen.getByRole('button', { name: /send to kitchen/i }));

    expect(apiClient.sendToKitchen).toHaveBeenCalledWith('order-xyz', 'send');
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });

  it('shows "Sending…" and disables the button while in-flight', async () => {
    let resolve: () => void;
    vi.mocked(apiClient.sendToKitchen).mockReturnValue(
      new Promise((r) => { resolve = () => r({} as never); }),
    );

    const user = userEvent.setup();
    render(<SendToKitchenButton orderId="o1" kitchenStatus="NONE" onSuccess={onSuccess} />);
    await user.click(screen.getByRole('button', { name: /send to kitchen/i }));

    expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled();
    resolve!();
  });

  it('shows error text and does NOT call onSuccess on failure', async () => {
    vi.mocked(apiClient.sendToKitchen).mockRejectedValue(new Error('Already sent'));
    const user = userEvent.setup();
    render(<SendToKitchenButton orderId="o1" kitchenStatus="NONE" onSuccess={onSuccess} />);
    await user.click(screen.getByRole('button', { name: /send to kitchen/i }));

    await waitFor(() => expect(screen.getByText('Already sent')).toBeInTheDocument());
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('clears previous error and retries on second click', async () => {
    vi.mocked(apiClient.sendToKitchen)
      .mockRejectedValueOnce(new Error('Network'))
      .mockResolvedValue({} as never);

    const user = userEvent.setup();
    render(<SendToKitchenButton orderId="o1" kitchenStatus="NONE" onSuccess={onSuccess} />);

    await user.click(screen.getByRole('button', { name: /send to kitchen/i }));
    await waitFor(() => expect(screen.getByText('Network')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /send to kitchen/i }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(screen.queryByText('Network')).toBeNull();
  });
});

describe('SendToKitchenButton — non-actionable statuses (display only)', () => {
  it('shows "Sent" label for TO_COOK — no button rendered', () => {
    render(<SendToKitchenButton orderId="o1" kitchenStatus="TO_COOK" onSuccess={onSuccess} />);
    expect(screen.getByText('Sent')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows "Preparing" label for PREPARING — no button rendered', () => {
    render(<SendToKitchenButton orderId="o1" kitchenStatus="PREPARING" onSuccess={onSuccess} />);
    expect(screen.getByText('Preparing')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows "Done" label for COMPLETED — no button rendered', () => {
    render(<SendToKitchenButton orderId="o1" kitchenStatus="COMPLETED" onSuccess={onSuccess} />);
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
