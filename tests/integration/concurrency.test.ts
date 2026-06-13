/**
 * Concurrency integration tests.
 *
 * Simulates multiple employees racing on shared resources:
 *   - One-draft-per-table: only the first concurrent create wins
 *   - Concurrent "Send to Kitchen" for the same order (only 1 should win)
 *   - Two employees each running a full order→send→pay flow on DIFFERENT tables
 *   - Kitchen advance flood (N workers advance same ticket, 1 wins per step)
 *   - Order number uniqueness under sequential creation
 *   - Idempotency suite for payment and kitchen state machine
 */
import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import {
  setupIntegration,
  teardownIntegration,
  makeOrderReq,
  makeKitchenReq,
  makePaymentReq,
  type IntegrationCtx,
} from './helpers';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
import * as authModule from '@/auth';

let ctx: IntegrationCtx;
let POST_ORDER: (req: Request) => Promise<Response>;
let POST_KITCHEN: (
  req: Request,
  routeCtx: { params: Promise<{ id: string }> },
) => Promise<Response>;
let POST_PAYMENT: (
  req: Request,
  routeCtx: { params: Promise<{ id: string }> },
) => Promise<Response>;

beforeAll(async () => {
  ctx = await setupIntegration();

  vi.mocked(authModule.auth).mockResolvedValue({
    user: { id: ctx.userId, role: 'EMPLOYEE' as const, email: 'cashier@test.com' },
  } as never);

  const orderMod = await import('@/app/api/orders/route');
  const kitchenMod = await import('@/app/api/orders/[id]/kitchen/route');
  const paymentMod = await import('@/app/api/orders/[id]/payment/route');

  POST_ORDER = orderMod.POST;
  POST_KITCHEN = kitchenMod.POST;
  POST_PAYMENT = paymentMod.POST;
});

afterAll(() => teardownIntegration(ctx));

afterEach(async () => {
  if (ctx.orderIds.length) {
    await db.order.deleteMany({ where: { id: { in: ctx.orderIds } } });
    ctx.orderIds = [];
  }
});

// ─── helpers ─────────────────────────────────────────────────────────────────

function kitchenRouteCtx(orderId: string) {
  return { params: Promise.resolve({ id: orderId }) };
}

function paymentRouteCtx(orderId: string) {
  return { params: Promise.resolve({ id: orderId }) };
}

async function createOrder(tableId: string): Promise<{ id: string; number: number }> {
  const product = ctx.products[0];
  const res = await POST_ORDER(
    makeOrderReq({ tableId, items: [{ productId: product.id, qty: 1 }] }),
  );
  if (res.status !== 201) {
    const body = await res.json() as { error?: string };
    throw new Error(`createOrder failed ${res.status}: ${body.error ?? '?'}`);
  }
  const body = await res.json() as { id: string; number: number };
  ctx.orderIds.push(body.id);
  return body;
}

async function tryCreateOrder(tableId: string): Promise<Response> {
  const product = ctx.products[0];
  return POST_ORDER(makeOrderReq({ tableId, items: [{ productId: product.id, qty: 1 }] }));
}

async function sendToKitchen(orderId: string): Promise<Response> {
  return POST_KITCHEN(makeKitchenReq(orderId, 'send'), kitchenRouteCtx(orderId));
}

async function advanceKitchen(orderId: string): Promise<Response> {
  return POST_KITCHEN(makeKitchenReq(orderId, 'advance'), kitchenRouteCtx(orderId));
}

async function payOrder(orderId: string, method: 'CASH' | 'CARD' = 'CARD'): Promise<Response> {
  const body = method === 'CASH' ? { method, amountReceived: 9999 } : { method };
  return POST_PAYMENT(makePaymentReq(orderId, body), paymentRouteCtx(orderId));
}

// ─── 1. One-draft-per-table constraint ───────────────────────────────────────

describe('one-draft-per-table constraint', () => {
  it('N concurrent creates on same table: exactly one wins (201), rest get 409', async () => {
    const WORKERS = 5;
    const responses = await Promise.all(
      Array.from({ length: WORKERS }, () => tryCreateOrder(ctx.tableId)),
    );
    const statuses = responses.map((r) => r.status);

    expect(statuses.filter((s) => s === 201)).toHaveLength(1);
    expect(statuses.filter((s) => s === 409)).toHaveLength(WORKERS - 1);

    // Collect the winning order for cleanup
    for (const r of responses) {
      if (r.status === 201) {
        const b = await r.json() as { id: string };
        ctx.orderIds.push(b.id);
      }
    }
  });

  it('second create on same table returns 409 "already has an open order"', async () => {
    const order = await createOrder(ctx.tableId);
    expect(order.id).toBeTruthy();

    const r2 = await tryCreateOrder(ctx.tableId);
    expect(r2.status).toBe(409);
    const body = await r2.json() as { error: string };
    expect(body.error).toMatch(/already has an open order/i);
  });

  it('table becomes free again after the draft order is deleted', async () => {
    const order = await createOrder(ctx.tableId);
    // Simulate cleanup (afterEach does this between tests)
    await db.order.delete({ where: { id: order.id } });
    ctx.orderIds = ctx.orderIds.filter((id) => id !== order.id);

    // Should be creatable again
    const r2 = await tryCreateOrder(ctx.tableId);
    expect(r2.status).toBe(201);
    const b = await r2.json() as { id: string };
    ctx.orderIds.push(b.id);
  });
});

// ─── 2. Concurrent orders on different tables ─────────────────────────────────

describe('N concurrent orders on different tables', () => {
  it('orders on separate tables do not interfere — all 201', async () => {
    const [o1, o2] = await Promise.all([
      createOrder(ctx.tableId),
      createOrder(ctx.table2Id),
    ]);
    expect(o1.id).not.toBe(o2.id);
    expect(o1.number).not.toBe(o2.number);
  });
});

// ─── 3. Concurrent "Send to Kitchen" for the same order ──────────────────────

describe('concurrent "Send to Kitchen" for the same order', () => {
  it('exactly one worker wins (200), the rest get 409', async () => {
    const order = await createOrder(ctx.tableId);
    const WORKERS = 5;

    const responses = await Promise.all(
      Array.from({ length: WORKERS }, () => sendToKitchen(order.id)),
    );
    const statuses = responses.map((r) => r.status);

    expect(statuses.filter((s) => s === 200)).toHaveLength(1);
    expect(statuses.filter((s) => s === 409)).toHaveLength(WORKERS - 1);
  });

  it('kitchen status in DB is TO_COOK after the race', async () => {
    const order = await createOrder(ctx.tableId);
    await Promise.all([sendToKitchen(order.id), sendToKitchen(order.id)]);

    const inDb = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(inDb.kitchenStatus).toBe('TO_COOK');
  });
});

// ─── 4. Concurrent kitchen advance flood ─────────────────────────────────────

describe('concurrent kitchen advance — optimistic lock holds under load', () => {
  it('TO_COOK → PREPARING: exactly one advance wins when N workers race', async () => {
    const order = await createOrder(ctx.tableId);
    await sendToKitchen(order.id); // order is now TO_COOK

    const WORKERS = 6;
    const responses = await Promise.all(
      Array.from({ length: WORKERS }, () => advanceKitchen(order.id)),
    );
    const statuses = responses.map((r) => r.status);

    expect(statuses.filter((s) => s === 200)).toHaveLength(1);
    expect(statuses.filter((s) => s === 409)).toHaveLength(WORKERS - 1);

    const inDb = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(inDb.kitchenStatus).toBe('PREPARING');
  });

  it('ticket goes NONE → TO_COOK → PREPARING → COMPLETED with no skips under concurrent pressure', async () => {
    const order = await createOrder(ctx.tableId);

    // send: 3 workers compete, 1 wins
    await Promise.all([sendToKitchen(order.id), sendToKitchen(order.id), sendToKitchen(order.id)]);
    let inDb = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(inDb.kitchenStatus).toBe('TO_COOK');

    // advance to PREPARING: 3 workers compete
    await Promise.all([advanceKitchen(order.id), advanceKitchen(order.id), advanceKitchen(order.id)]);
    inDb = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(inDb.kitchenStatus).toBe('PREPARING');

    // advance to COMPLETED: 3 workers compete
    await Promise.all([advanceKitchen(order.id), advanceKitchen(order.id), advanceKitchen(order.id)]);
    inDb = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(inDb.kitchenStatus).toBe('COMPLETED');
  });
});

// ─── 5. Two "employees" run full order → send → pay on different tables ───────

describe('two employees complete independent orders on different tables', () => {
  it('both orders reach PAID status without corruption', async () => {
    // Each employee works on their own table
    const [order1, order2] = await Promise.all([
      createOrder(ctx.tableId),
      createOrder(ctx.table2Id),
    ]);

    // Both send to kitchen simultaneously
    const [send1, send2] = await Promise.all([
      sendToKitchen(order1.id),
      sendToKitchen(order2.id),
    ]);
    expect(send1.status).toBe(200);
    expect(send2.status).toBe(200);

    // Both pay simultaneously
    const [pay1, pay2] = await Promise.all([
      payOrder(order1.id),
      payOrder(order2.id),
    ]);
    expect(pay1.status).toBe(200);
    expect(pay2.status).toBe(200);

    const [db1, db2] = await Promise.all([
      db.order.findUniqueOrThrow({ where: { id: order1.id } }),
      db.order.findUniqueOrThrow({ where: { id: order2.id } }),
    ]);
    expect(db1.status).toBe('PAID');
    expect(db2.status).toBe('PAID');
  });

  it('paying order1 does not affect order2 status', async () => {
    const [order1, order2] = await Promise.all([
      createOrder(ctx.tableId),
      createOrder(ctx.table2Id),
    ]);

    // Pay only order1
    const pay = await payOrder(order1.id);
    expect(pay.status).toBe(200);

    // order2 must still be DRAFT
    const db2 = await db.order.findUniqueOrThrow({ where: { id: order2.id } });
    expect(db2.status).toBe('DRAFT');
  });
});

// ─── 6. Concurrent payment attempts on the same order ────────────────────────

describe('concurrent payment — atomic guard', () => {
  it('exactly one payment wins when N workers race on the same order', async () => {
    const order = await createOrder(ctx.tableId);
    const WORKERS = 4;

    const responses = await Promise.all(
      Array.from({ length: WORKERS }, () => payOrder(order.id, 'CARD')),
    );
    const statuses = responses.map((r) => r.status);

    expect(statuses.filter((s) => s === 200)).toHaveLength(1);
    expect(statuses.filter((s) => s === 409)).toHaveLength(WORKERS - 1);

    const inDb = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(inDb.status).toBe('PAID');
  });

  it('only one payment record is created even when N requests race', async () => {
    const order = await createOrder(ctx.tableId);

    await Promise.all([
      payOrder(order.id, 'CARD'),
      payOrder(order.id, 'CARD'),
      payOrder(order.id, 'CARD'),
    ]);

    const payments = await db.payment.findMany({ where: { orderId: order.id } });
    expect(payments).toHaveLength(1);
  });
});

// ─── 7. Order number uniqueness stress test ───────────────────────────────────

describe('order number uniqueness under concurrent creation', () => {
  it('sequential orders on two tables produce distinct order numbers', async () => {
    // Create sequentially to avoid one-draft-per-table conflicts
    const order1 = await createOrder(ctx.tableId);
    const order2 = await createOrder(ctx.table2Id);

    expect(order1.number).not.toBe(order2.number);
    expect(order1.id).not.toBe(order2.id);
  });
});

// ─── 8. Idempotency ───────────────────────────────────────────────────────────

describe('idempotency — order creation: one draft per table enforced', () => {
  it('posting the same order body twice: first 201, second 409 (table occupied)', async () => {
    const product = ctx.products[0];
    const body = { tableId: ctx.tableId, items: [{ productId: product.id, qty: 1 }] };

    const r1 = await POST_ORDER(makeOrderReq(body));
    expect(r1.status).toBe(201);
    const b1 = await r1.json() as { id: string };
    ctx.orderIds.push(b1.id);

    const r2 = await POST_ORDER(makeOrderReq(body));
    expect(r2.status).toBe(409);
    const b2 = await r2.json() as { error: string };
    expect(b2.error).toMatch(/already has an open order/i);
  });
});

describe('idempotency — kitchen send is guarded (not safe to retry naively)', () => {
  it('retrying send after success returns 409 — order stays at TO_COOK, not double-stepped', async () => {
    const order = await createOrder(ctx.tableId);

    const first = await sendToKitchen(order.id);
    expect(first.status).toBe(200);

    const retry = await sendToKitchen(order.id);
    expect(retry.status).toBe(409);

    // kitchenStatus must stay TO_COOK, not jump to PREPARING
    const inDb = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(inDb.kitchenStatus).toBe('TO_COOK');
  });

  it('advance is a forward-only state machine — each call moves the state forward, COMPLETED blocks further advances', async () => {
    const order = await createOrder(ctx.tableId);
    await sendToKitchen(order.id); // NONE → TO_COOK

    const toPrep = await advanceKitchen(order.id);
    expect(toPrep.status).toBe(200); // TO_COOK → PREPARING

    const toComplete = await advanceKitchen(order.id);
    expect(toComplete.status).toBe(200); // PREPARING → COMPLETED

    // Only at COMPLETED does advance become a 409 (terminal state)
    const overAdvance = await advanceKitchen(order.id);
    expect(overAdvance.status).toBe(409);

    const inDb = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(inDb.kitchenStatus).toBe('COMPLETED');
  });
});

describe('idempotency — payment is guarded (network-retry safe via 409)', () => {
  it('retrying a successful payment returns 409 with a single payment record in DB', async () => {
    const order = await createOrder(ctx.tableId);

    const first = await payOrder(order.id, 'CARD');
    expect(first.status).toBe(200);

    const retry = await payOrder(order.id, 'CARD');
    expect(retry.status).toBe(409);

    const payments = await db.payment.findMany({ where: { orderId: order.id } });
    expect(payments).toHaveLength(1);
  });

  it('retrying payment with different method still returns 409 (order locked once PAID)', async () => {
    const order = await createOrder(ctx.tableId);
    await payOrder(order.id, 'CARD');

    // Retry with CASH — should still be 409
    const retry = await payOrder(order.id, 'CASH');
    expect(retry.status).toBe(409);

    const payments = await db.payment.findMany({ where: { orderId: order.id } });
    expect(payments).toHaveLength(1);
    expect(payments[0].method).toBe('CARD');
  });
});
