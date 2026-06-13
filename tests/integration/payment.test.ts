/**
 * Integration tests for POST /api/orders/:id/payment
 */
import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { setupIntegration, teardownIntegration, seedOrder, type IntegrationCtx } from './helpers';
import { db } from '@/lib/db';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
import * as authModule from '@/auth';

let ctx: IntegrationCtx;
let POST_PAYMENT: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;

beforeAll(async () => {
  ctx = await setupIntegration();
  vi.mocked(authModule.auth).mockResolvedValue({
    user: { id: ctx.userId, role: 'EMPLOYEE' as const, email: 'cashier@test.com' },
  } as never);

  const mod = await import('@/app/api/orders/[id]/payment/route');
  POST_PAYMENT = mod.POST;
});

afterAll(() => teardownIntegration(ctx));

afterEach(async () => {
  if (ctx.orderIds.length) {
    await db.order.deleteMany({ where: { id: { in: ctx.orderIds } } });
    ctx.orderIds = [];
  }
});

function payReq(orderId: string, body: object) {
  return new Request(`http://localhost/api/orders/${orderId}/payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

// ─── Cash payments ────────────────────────────────────────────────────────────

describe('payment: CASH happy path', () => {
  it('marks order PAID and returns correct changeDue', async () => {
    const order = await seedOrder(ctx);
    const total = parseFloat(order.total.toString());
    const amountReceived = total + 50;

    const res = await POST_PAYMENT(payReq(order.id, { method: 'CASH', amountReceived }), params(order.id));
    expect(res.status).toBe(200);
    const body = await res.json() as { order: { status: string }; changeDue: string };

    expect(body.order.status).toBe('PAID');
    expect(parseFloat(body.changeDue)).toBeCloseTo(50, 2);
  });

  it('zero change when amountReceived equals total exactly', async () => {
    const order = await seedOrder(ctx);
    const total = parseFloat(order.total.toString());

    const res = await POST_PAYMENT(payReq(order.id, { method: 'CASH', amountReceived: total }), params(order.id));
    expect(res.status).toBe(200);
    const body = await res.json() as { changeDue: string };
    expect(parseFloat(body.changeDue)).toBe(0);
  });
});

describe('payment: CASH failures', () => {
  it('400 when amountReceived < total', async () => {
    const order = await seedOrder(ctx);
    const total = parseFloat(order.total.toString());

    const res = await POST_PAYMENT(payReq(order.id, { method: 'CASH', amountReceived: total - 1 }), params(order.id));
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/less than/i);
  });

  it('400 when amountReceived is missing for CASH', async () => {
    const order = await seedOrder(ctx);
    const res = await POST_PAYMENT(payReq(order.id, { method: 'CASH' }), params(order.id));
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/amountReceived/i);
  });

  it('400 when amountReceived is a non-numeric string', async () => {
    const order = await seedOrder(ctx);
    const res = await POST_PAYMENT(payReq(order.id, { method: 'CASH', amountReceived: 'lots' }), params(order.id));
    expect(res.status).toBe(400);
  });

  it('400 when amountReceived is 0', async () => {
    const order = await seedOrder(ctx);
    const res = await POST_PAYMENT(payReq(order.id, { method: 'CASH', amountReceived: 0 }), params(order.id));
    expect(res.status).toBe(400);
  });
});

// ─── Card / UPI payments ──────────────────────────────────────────────────────

describe('payment: CARD and UPI', () => {
  it('CARD payment succeeds without amountReceived', async () => {
    const order = await seedOrder(ctx);
    const res = await POST_PAYMENT(payReq(order.id, { method: 'CARD' }), params(order.id));
    expect(res.status).toBe(200);
    const body = await res.json() as { order: { status: string }; changeDue: string | null };
    expect(body.order.status).toBe('PAID');
    expect(body.changeDue).toBeNull();
  });

  it('CARD payment stores optional reference', async () => {
    const order = await seedOrder(ctx);
    const res = await POST_PAYMENT(payReq(order.id, { method: 'CARD', reference: 'TXN123' }), params(order.id));
    expect(res.status).toBe(200);
    const body = await res.json() as { payment: { reference: string } };
    expect(body.payment.reference).toBe('TXN123');
  });

  it('UPI payment succeeds', async () => {
    const order = await seedOrder(ctx);
    const res = await POST_PAYMENT(payReq(order.id, { method: 'UPI', reference: 'upi-ref-1' }), params(order.id));
    expect(res.status).toBe(200);
  });
});

// ─── Double-payment / state guard ─────────────────────────────────────────────

describe('payment: double-pay prevention', () => {
  it('409 when attempting to pay an already PAID order', async () => {
    const order = await seedOrder(ctx);
    const total = parseFloat(order.total.toString());

    // First payment succeeds
    const r1 = await POST_PAYMENT(payReq(order.id, { method: 'CASH', amountReceived: total + 100 }), params(order.id));
    expect(r1.status).toBe(200);

    // Second payment on the same order is rejected
    const r2 = await POST_PAYMENT(payReq(order.id, { method: 'CASH', amountReceived: total + 100 }), params(order.id));
    expect(r2.status).toBe(409);
    const body = await r2.json() as { error: string };
    expect(body.error).toMatch(/not payable/i);
  });

  it('concurrent double-payment race: exactly one 200 and one 409', async () => {
    const order = await seedOrder(ctx);
    const total = parseFloat(order.total.toString());

    const makeReq = () => POST_PAYMENT(
      payReq(order.id, { method: 'CASH', amountReceived: total + 100 }),
      params(order.id),
    );

    const [r1, r2] = await Promise.all([makeReq(), makeReq()]);
    const statuses = [r1.status, r2.status].sort((a, b) => a - b);

    expect(statuses).toEqual([200, 409]);

    // Exactly one Payment record created
    const payments = await db.payment.findMany({ where: { orderId: order.id } });
    expect(payments).toHaveLength(1);
  });
});

// ─── Invalid method + non-existent order ─────────────────────────────────────

describe('payment: validation', () => {
  it('400 for unsupported payment method', async () => {
    const order = await seedOrder(ctx);
    const res = await POST_PAYMENT(payReq(order.id, { method: 'BITCOIN' }), params(order.id));
    expect(res.status).toBe(400);
  });

  it('404 for a non-existent order id', async () => {
    const res = await POST_PAYMENT(payReq('ghost-id', { method: 'CARD' }), params('ghost-id'));
    expect(res.status).toBe(404);
  });
});

// ─── Disabled payment method ──────────────────────────────────────────────────

describe('payment: disabled method', () => {
  it('409 when the chosen payment method is disabled by admin', async () => {
    // Temporarily disable CARD
    await db.paymentMethodSetting.update({ where: { method: 'CARD' }, data: { enabled: false } });

    try {
      const order = await seedOrder(ctx);
      const res = await POST_PAYMENT(payReq(order.id, { method: 'CARD' }), params(order.id));
      expect(res.status).toBe(409);
      const body = await res.json() as { error: string };
      expect(body.error).toMatch(/disabled/i);
    } finally {
      // Always restore
      await db.paymentMethodSetting.update({ where: { method: 'CARD' }, data: { enabled: true } });
    }
  });
});
