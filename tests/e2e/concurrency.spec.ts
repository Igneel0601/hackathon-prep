/**
 * Concurrency tests — HTTP-level race conditions.
 * Uses Playwright APIRequestContext (no browser UI).
 * storageState: cashier.json
 *
 * These tests verify the DB-level optimistic locks:
 *   - Double payment: atomic DRAFT→PAID update
 *   - Double kitchen advance: atomic kitchenStatus update
 *   - One draft per table: partial-unique index
 */
import { test, expect } from '@playwright/test';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getFreeTable(request: { get: (url: string) => Promise<{ json: () => Promise<unknown> }> }) {
  const res = await request.get('/api/tables');
  const { floors } = await res.json() as { floors: { tables: { id: string; hasActiveOrder: boolean }[] }[] };
  return floors.flatMap((f) => f.tables).find((t) => !t.hasActiveOrder) ?? null;
}

async function getKitchenProduct(request: { get: (url: string) => Promise<{ json: () => Promise<unknown> }> }) {
  const res = await request.get('/api/products');
  const { products } = await res.json() as { products: { id: string; sendToKitchen: boolean }[] };
  return products.find((p) => p.sendToKitchen) ?? products[0];
}

async function createOrder(
  request: { post: (url: string, opts: object) => Promise<{ status: () => number; json: () => Promise<unknown> }> },
  tableId: string,
  productId: string,
): Promise<{ id: string; number: number; total: string }> {
  const res = await request.post('/api/orders', {
    data: { tableId, items: [{ productId, qty: 1 }] },
  });
  if (res.status() === 201) {
    return res.json() as Promise<{ id: string; number: number; total: string }>;
  }
  const body = await res.json();
  throw new Error(`createOrder failed with ${res.status()}: ${JSON.stringify(body)}`);
}

// ─── Double-payment race ──────────────────────────────────────────────────────

test('double-payment race: exactly one 200, one 409', async ({ request, browser }) => {
  const table = await getFreeTable(request);
  if (!table) test.skip();
  const product = await getKitchenProduct(request);

  const order = await createOrder(request, table!.id, product!.id);
  const total = parseFloat(order.total);

  // Two separate authenticated contexts (simulate two cashier tabs/windows)
  const ctx1 = await browser.newContext({ storageState: 'tests/e2e/.auth/cashier.json' });
  const ctx2 = await browser.newContext({ storageState: 'tests/e2e/.auth/cashier.json' });

  const payload = { method: 'CASH', amountReceived: total + 100 };

  const [r1, r2] = await Promise.all([
    ctx1.request.post(`/api/orders/${order.id}/payment`, { data: payload }),
    ctx2.request.post(`/api/orders/${order.id}/payment`, { data: payload }),
  ]);

  const statuses = [r1.status(), r2.status()].sort((a, b) => a - b);
  expect(statuses).toEqual([200, 409]);

  await ctx1.close();
  await ctx2.close();
});

// ─── Double kitchen advance race ──────────────────────────────────────────────

test('concurrent kitchen advance: order moves to PREPARING only, not COMPLETED', async ({ request, browser }) => {
  const table = await getFreeTable(request);
  if (!table) test.skip();
  const product = await getKitchenProduct(request);

  const order = await createOrder(request, table!.id, product!.id);

  // Send to kitchen
  const sendRes = await request.post(`/api/orders/${order.id}/kitchen`, { data: { action: 'send' } });
  expect(sendRes.status()).toBe(200);

  const ctx1 = await browser.newContext({ storageState: 'tests/e2e/.auth/cashier.json' });
  const ctx2 = await browser.newContext({ storageState: 'tests/e2e/.auth/cashier.json' });

  // Both try to advance simultaneously
  const [r1, r2] = await Promise.all([
    ctx1.request.post(`/api/orders/${order.id}/kitchen`, { data: { action: 'advance' } }),
    ctx2.request.post(`/api/orders/${order.id}/kitchen`, { data: { action: 'advance' } }),
  ]);

  const statuses = [r1.status(), r2.status()].sort((a, b) => a - b);
  // One wins (200), one is rejected (409)
  expect(statuses).toEqual([200, 409]);

  // The order must be PREPARING, not COMPLETED — double-advance was blocked
  const kitchenRes = await request.get('/api/kitchen');
  const { tickets } = await kitchenRes.json() as { tickets: { orderId: string; kitchenStatus: string }[] };
  const ticket = tickets.find((t) => t.orderId === order.id);
  expect(ticket?.kitchenStatus).toBe('PREPARING');

  await ctx1.close();
  await ctx2.close();

  // Cleanup
  await request.post(`/api/orders/${order.id}/kitchen`, { data: { action: 'advance' } });
});

// ─── Back button idempotency ───────────────────────────────────────────────────

test('back button after payment → paying again returns 409', async ({ request }) => {
  const table = await getFreeTable(request);
  if (!table) test.skip();
  const product = await getKitchenProduct(request);

  const order = await createOrder(request, table!.id, product!.id);
  const total = parseFloat(order.total);

  // First payment
  const r1 = await request.post(`/api/orders/${order.id}/payment`, {
    data: { method: 'CASH', amountReceived: total + 100 },
  });
  expect(r1.status()).toBe(200);

  // Simulate hitting Back and retrying
  const r2 = await request.post(`/api/orders/${order.id}/payment`, {
    data: { method: 'CASH', amountReceived: total + 100 },
  });
  expect(r2.status()).toBe(409);
  const body = await r2.json() as { error: string };
  expect(body.error).toMatch(/not payable/i);
});

// ─── One draft per table constraint ───────────────────────────────────────────

test('two orders on same table: second is rejected (one draft per table)', async ({ request, browser }) => {
  const table = await getFreeTable(request);
  if (!table) test.skip();
  const product = await getKitchenProduct(request);

  const ctx1 = await browser.newContext({ storageState: 'tests/e2e/.auth/cashier.json' });
  const ctx2 = await browser.newContext({ storageState: 'tests/e2e/.auth/cashier.json' });

  const payload = {
    data: { tableId: table!.id, items: [{ productId: product!.id, qty: 1 }] },
  };

  const [r1, r2] = await Promise.all([
    ctx1.request.post('/api/orders', payload),
    ctx2.request.post('/api/orders', payload),
  ]);

  const statuses = [r1.status(), r2.status()].sort((a, b) => a - b);
  // One wins (201), one is rejected (409 — table already has an open order)
  expect(statuses).toEqual([201, 409]);

  const loser = r1.status() === 409 ? r1 : r2;
  const body = await loser.json() as { error: string };
  expect(body.error).toMatch(/already has an open order/i);

  await ctx1.close();
  await ctx2.close();
});

// ─── API auth guard ───────────────────────────────────────────────────────────

test('unauthenticated API call to /api/orders returns 401', async ({ browser }) => {
  // Explicitly clear storageState — newContext() inherits project storageState by default
  const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const res = await ctx.request.get('/api/orders');
  expect(res.status()).toBe(401);
  await ctx.close();
});

test('unauthenticated API call to /api/kitchen returns 401', async ({ browser }) => {
  const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const res = await ctx.request.get('/api/kitchen');
  expect(res.status()).toBe(401);
  await ctx.close();
});
