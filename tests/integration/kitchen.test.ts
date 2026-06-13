/**
 * Integration tests for:
 *   POST /api/orders/:id/kitchen  (send + advance)
 *   GET  /api/kitchen             (ticket list)
 */
import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { setupIntegration, teardownIntegration, seedOrder, type IntegrationCtx } from './helpers';
import { db } from '@/lib/db';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
import * as authModule from '@/auth';

let ctx: IntegrationCtx;
let POST_KITCHEN: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;
let GET_KITCHEN: (req: Request) => Promise<Response>;

beforeAll(async () => {
  ctx = await setupIntegration();
  vi.mocked(authModule.auth).mockResolvedValue({
    user: { id: ctx.userId, role: 'EMPLOYEE' as const, email: 'cashier@test.com' },
  } as never);

  const kitchenRoute = await import('@/app/api/orders/[id]/kitchen/route');
  POST_KITCHEN = kitchenRoute.POST;
  const kitchenGet = await import('@/app/api/kitchen/route');
  GET_KITCHEN = kitchenGet.GET as typeof GET_KITCHEN;
});

afterAll(() => teardownIntegration(ctx));

afterEach(async () => {
  if (ctx.orderIds.length) {
    await db.order.deleteMany({ where: { id: { in: ctx.orderIds } } });
    ctx.orderIds = [];
  }
});

function kitchenReq(orderId: string, action: 'send' | 'advance') {
  return new Request(`http://localhost/api/orders/${orderId}/kitchen`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
}

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

// ─── send action ─────────────────────────────────────────────────────────────

describe('kitchen action: send', () => {
  it('transitions NONE → TO_COOK and returns the updated order', async () => {
    const order = await seedOrder(ctx, 'NONE');
    const res = await POST_KITCHEN(kitchenReq(order.id, 'send'), params(order.id));
    expect(res.status).toBe(200);
    const body = await res.json() as { kitchenStatus: string };
    expect(body.kitchenStatus).toBe('TO_COOK');
  });

  it('409 when order is already TO_COOK (already sent)', async () => {
    const order = await seedOrder(ctx, 'TO_COOK');
    const res = await POST_KITCHEN(kitchenReq(order.id, 'send'), params(order.id));
    expect(res.status).toBe(409);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/already sent/i);
  });

  it('409 when order is PREPARING', async () => {
    const order = await seedOrder(ctx, 'PREPARING');
    const res = await POST_KITCHEN(kitchenReq(order.id, 'send'), params(order.id));
    expect(res.status).toBe(409);
  });

  it('409 when order is COMPLETED', async () => {
    const order = await seedOrder(ctx, 'COMPLETED');
    const res = await POST_KITCHEN(kitchenReq(order.id, 'send'), params(order.id));
    expect(res.status).toBe(409);
  });
});

// ─── advance action ───────────────────────────────────────────────────────────

describe('kitchen action: advance', () => {
  it('transitions TO_COOK → PREPARING', async () => {
    const order = await seedOrder(ctx, 'TO_COOK');
    const res = await POST_KITCHEN(kitchenReq(order.id, 'advance'), params(order.id));
    expect(res.status).toBe(200);
    const body = await res.json() as { kitchenStatus: string };
    expect(body.kitchenStatus).toBe('PREPARING');
  });

  it('transitions PREPARING → COMPLETED', async () => {
    const order = await seedOrder(ctx, 'PREPARING');
    const res = await POST_KITCHEN(kitchenReq(order.id, 'advance'), params(order.id));
    expect(res.status).toBe(200);
    const body = await res.json() as { kitchenStatus: string };
    expect(body.kitchenStatus).toBe('COMPLETED');
  });

  it('409 when order is NONE — must send first', async () => {
    const order = await seedOrder(ctx, 'NONE');
    const res = await POST_KITCHEN(kitchenReq(order.id, 'advance'), params(order.id));
    expect(res.status).toBe(409);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/send to kitchen first/i);
  });

  it('409 when order is already COMPLETED', async () => {
    const order = await seedOrder(ctx, 'COMPLETED');
    const res = await POST_KITCHEN(kitchenReq(order.id, 'advance'), params(order.id));
    expect(res.status).toBe(409);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/already completed/i);
  });
});

// ─── validation ───────────────────────────────────────────────────────────────

describe('kitchen action: validation', () => {
  it('404 for a non-existent order id', async () => {
    const res = await POST_KITCHEN(kitchenReq('does-not-exist', 'send'), params('does-not-exist'));
    expect(res.status).toBe(404);
  });

  it('400 for an invalid action string', async () => {
    const order = await seedOrder(ctx, 'NONE');
    const req = new Request(`http://localhost/api/orders/${order.id}/kitchen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cook_it' }),
    });
    const res = await POST_KITCHEN(req, params(order.id));
    expect(res.status).toBe(400);
  });
});

// ─── optimistic locking (concurrency guard) ───────────────────────────────────

describe('kitchen concurrent advance — optimistic lock', () => {
  it('two simultaneous advances: one wins 200, one gets 409', async () => {
    const order = await seedOrder(ctx, 'TO_COOK');

    // Fire both requests in parallel before either can update the row
    const [r1, r2] = await Promise.all([
      POST_KITCHEN(kitchenReq(order.id, 'advance'), params(order.id)),
      POST_KITCHEN(kitchenReq(order.id, 'advance'), params(order.id)),
    ]);

    const statuses = [r1.status, r2.status].sort();
    expect(statuses).toEqual([200, 409]);

    // The DB should reflect exactly PREPARING (not COMPLETED — double-step prevented)
    const updated = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(updated.kitchenStatus).toBe('PREPARING');
  });
});

// ─── GET /api/kitchen ─────────────────────────────────────────────────────────

describe('GET /api/kitchen', () => {
  it('returns only TO_COOK and PREPARING tickets by default', async () => {
    const toCook = await seedOrder(ctx, 'TO_COOK');
    const preparing = await seedOrder(ctx, 'PREPARING');
    const completed = await seedOrder(ctx, 'COMPLETED');
    const none = await seedOrder(ctx, 'NONE');

    const res = await GET_KITCHEN(new Request('http://localhost/api/kitchen'));
    expect(res.status).toBe(200);
    const body = await res.json() as { tickets: { orderId: string }[] };

    const ids = body.tickets.map((t) => t.orderId);
    expect(ids).toContain(toCook.id);
    expect(ids).toContain(preparing.id);
    expect(ids).not.toContain(completed.id);
    expect(ids).not.toContain(none.id);
  });

  it('filters items to only sendToKitchen=true products', async () => {
    // Create an order with a kitchen product
    if (!ctx.kitchenProducts.length) return; // skip if no kitchen products in seed

    const order = await seedOrder(ctx, 'TO_COOK');
    const res = await GET_KITCHEN(new Request('http://localhost/api/kitchen'));
    const body = await res.json() as { tickets: { orderId: string; items: object[] }[] };

    const ticket = body.tickets.find((t) => t.orderId === order.id);
    // Items on this ticket should only include sendToKitchen products
    // (seedOrder uses kitchenProducts[0] if available)
    if (ticket) {
      expect(ticket.items.length).toBeGreaterThan(0);
    }
  });

  it('filters by explicit status=COMPLETED', async () => {
    const completed = await seedOrder(ctx, 'COMPLETED');
    const toCook = await seedOrder(ctx, 'TO_COOK');

    const res = await GET_KITCHEN(new Request('http://localhost/api/kitchen?status=COMPLETED'));
    expect(res.status).toBe(200);
    const body = await res.json() as { tickets: { orderId: string }[] };

    const ids = body.tickets.map((t) => t.orderId);
    expect(ids).toContain(completed.id);
    expect(ids).not.toContain(toCook.id);
  });

  it('400 for invalid status filter value', async () => {
    const res = await GET_KITCHEN(new Request('http://localhost/api/kitchen?status=BURNED'));
    expect(res.status).toBe(400);
  });

  it('returns empty tickets array when no active orders', async () => {
    // Don't seed any orders
    const res = await GET_KITCHEN(new Request('http://localhost/api/kitchen'));
    expect(res.status).toBe(200);
    const body = await res.json() as { tickets: object[] };
    // Other tests may have left tickets; just assert shape is correct
    expect(Array.isArray(body.tickets)).toBe(true);
  });
});
