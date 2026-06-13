/**
 * Integration tests for POST /api/orders and GET /api/orders.
 * Auth is mocked; DB is real (Neon).
 */
import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { setupIntegration, teardownIntegration, type IntegrationCtx } from './helpers';

// ─── Mock auth only — keep real DB logic ─────────────────────────────────────
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

import * as authModule from '@/auth';

let ctx: IntegrationCtx;

// Import route handlers after mocks are set up
let POST: (req: Request) => Promise<Response>;
let GET: (req: Request) => Promise<Response>;

beforeAll(async () => {
  ctx = await setupIntegration();

  // Point auth mock at our test user
  vi.mocked(authModule.auth).mockResolvedValue({
    user: { id: ctx.userId, role: 'EMPLOYEE' as const, email: 'cashier@test.com' },
  } as never);

  const mod = await import('@/app/api/orders/route');
  POST = mod.POST;
  GET = mod.GET as typeof GET;
});

afterAll(() => teardownIntegration(ctx));

afterEach(async () => {
  // Clean up orders created in this test from the DB
  if (ctx.orderIds.length) {
    const { db } = await import('@/lib/db');
    await db.order.deleteMany({ where: { id: { in: ctx.orderIds } } });
    ctx.orderIds = [];
  }
});

// ─── POST /api/orders ─────────────────────────────────────────────────────────

describe('POST /api/orders — happy paths', () => {
  it('creates an order and returns 201 with correct totals', async () => {
    const product = ctx.products[0];
    const req = new Request('http://localhost/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableId: ctx.tableId, items: [{ productId: product.id, qty: 2 }] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const body = await res.json() as { id: string; subtotal: string; tax: string; total: string; items: object[] };
    ctx.orderIds.push(body.id);

    const price = parseFloat(product.price);
    const expectedSubtotal = (price * 2).toFixed(2);
    const expectedTax = ((price * 2 * parseFloat(product.tax)) / 100).toFixed(2);
    const expectedTotal = (parseFloat(expectedSubtotal) + parseFloat(expectedTax)).toFixed(2);

    expect(body.subtotal).toBe(expectedSubtotal);
    expect(body.tax).toBe(expectedTax);
    expect(body.total).toBe(expectedTotal);
    expect(body.items).toHaveLength(1);
  });

  it('applies discount and reduces total accordingly', async () => {
    const product = ctx.products[0];
    const discount = 10;
    const req = new Request('http://localhost/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableId: ctx.tableId,
        items: [{ productId: product.id, qty: 1 }],
        discount,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json() as { id: string; total: string; discount: string };
    ctx.orderIds.push(body.id);

    expect(body.discount).toBe('10.00');
    // total = subtotal + tax - discount
    const price = parseFloat(product.price);
    const tax = (price * parseFloat(product.tax)) / 100;
    expect(parseFloat(body.total)).toBeCloseTo(price + tax - discount, 2);
  });

  it('handles multiple products and sums totals correctly', async () => {
    const [p1, p2] = ctx.products;
    const req = new Request('http://localhost/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableId: ctx.tableId,
        items: [
          { productId: p1.id, qty: 1 },
          { productId: p2.id, qty: 3 },
        ],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json() as { id: string; items: object[] };
    ctx.orderIds.push(body.id);
    expect(body.items).toHaveLength(2);
  });
});

describe('POST /api/orders — validation failures', () => {
  it('400 when items array is empty', async () => {
    const req = new Request('http://localhost/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableId: ctx.tableId, items: [] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/items/i);
  });

  it('400 when items is missing', async () => {
    const req = new Request('http://localhost/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableId: ctx.tableId }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('400 when tableId is missing', async () => {
    const req = new Request('http://localhost/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ productId: ctx.products[0].id, qty: 1 }] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/tableId/i);
  });

  it('400 for a non-existent tableId', async () => {
    const req = new Request('http://localhost/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableId: 'not-a-real-id', items: [{ productId: ctx.products[0].id, qty: 1 }] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('400 for a non-existent productId', async () => {
    const req = new Request('http://localhost/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableId: ctx.tableId, items: [{ productId: 'fake-product', qty: 1 }] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('400 for qty = 0', async () => {
    const req = new Request('http://localhost/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableId: ctx.tableId, items: [{ productId: ctx.products[0].id, qty: 0 }] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('400 for fractional qty', async () => {
    const req = new Request('http://localhost/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableId: ctx.tableId, items: [{ productId: ctx.products[0].id, qty: 1.5 }] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('400 for negative discount', async () => {
    const req = new Request('http://localhost/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableId: ctx.tableId, items: [{ productId: ctx.products[0].id, qty: 1 }], discount: -5 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('400 for invalid JSON body', async () => {
    const req = new Request('http://localhost/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ─── GET /api/orders ──────────────────────────────────────────────────────────

describe('GET /api/orders', () => {
  it('returns orders for the current session', async () => {
    // Create an order first
    const product = ctx.products[0];
    const createReq = new Request('http://localhost/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableId: ctx.tableId, items: [{ productId: product.id, qty: 1 }] }),
    });
    const createRes = await POST(createReq);
    const created = await createRes.json() as { id: string };
    ctx.orderIds.push(created.id);

    const getReq = new Request('http://localhost/api/orders');
    const res = await GET(getReq);
    expect(res.status).toBe(200);

    const orders = await res.json() as { id: string }[];
    expect(orders.some((o) => o.id === created.id)).toBe(true);
  });

  it('400 for invalid status filter', async () => {
    const req = new Request('http://localhost/api/orders?status=INVALID');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });
});
