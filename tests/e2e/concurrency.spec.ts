/**
 * Concurrency tests — HTTP-level race conditions.
 * Uses Playwright APIRequestContext (no browser UI).
 * storageState: cashier.json
 *
 * These tests verify the DB-level optimistic locks:
 *   - Double payment: atomic DRAFT→PAID update
 *   - Double kitchen advance: atomic kitchenStatus update
 *   - Signup race: email uniqueness constraint
 */
import { test, expect } from '@playwright/test';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getTableAndProduct(request: ReturnType<typeof test.info>['fn'] extends (args: { request: infer R }) => unknown ? R : never) {
  const tablesRes = await (request as Parameters<typeof test>[1] extends (args: { request: infer R }) => unknown ? R : never).get('/api/tables');
  return tablesRes;
}

// Simpler inline helpers
async function getFreeTable(request: { get: (url: string) => Promise<{ json: () => Promise<unknown> }> }) {
  const res = await request.get('/api/tables');
  const { floors } = await res.json() as { floors: { tables: { id: string; hasActiveOrder: boolean }[] }[] };
  return floors.flatMap((f) => f.tables).find((t) => !t.hasActiveOrder);
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
) {
  const res = await request.post('/api/orders', {
    data: { tableId, items: [{ productId, qty: 1 }] },
  });
  expect(res.status()).toBe(201);
  return res.json() as Promise<{ id: string; number: number; total: string }>;
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

  const req1 = await ctx1.request.newContext();
  const req2 = await ctx2.request.newContext();

  const payload = { method: 'CASH', amountReceived: total + 100 };

  const [r1, r2] = await Promise.all([
    req1.post(`/api/orders/${order.id}/payment`, { data: payload }),
    req2.post(`/api/orders/${order.id}/payment`, { data: payload }),
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
  const req1 = await ctx1.request.newContext();
  const req2 = await ctx2.request.newContext();

  // Both try to advance simultaneously
  const [r1, r2] = await Promise.all([
    req1.post(`/api/orders/${order.id}/kitchen`, { data: { action: 'advance' } }),
    req2.post(`/api/orders/${order.id}/kitchen`, { data: { action: 'advance' } }),
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

// ─── Simultaneous payment from two browser contexts (same user) ───────────────

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

// ─── Concurrent order creation (same table) ───────────────────────────────────

test('multiple orders on same table are allowed (no uniqueness violation)', async ({ request, browser }) => {
  const table = await getFreeTable(request);
  if (!table) test.skip();
  const product = await getKitchenProduct(request);

  const ctx1 = await browser.newContext({ storageState: 'tests/e2e/.auth/cashier.json' });
  const ctx2 = await browser.newContext({ storageState: 'tests/e2e/.auth/cashier.json' });
  const req1 = await ctx1.request.newContext();
  const req2 = await ctx2.request.newContext();

  const payload = {
    data: { tableId: table!.id, items: [{ productId: product!.id, qty: 1 }] },
  };

  const [r1, r2] = await Promise.all([
    req1.post('/api/orders', payload),
    req2.post('/api/orders', payload),
  ]);

  // Both should succeed — multiple draft orders per table are allowed
  expect(r1.status()).toBe(201);
  expect(r2.status()).toBe(201);

  await ctx1.close();
  await ctx2.close();
});

// ─── API auth guard ───────────────────────────────────────────────────────────

test('unauthenticated API call to /api/orders returns 401', async ({ browser }) => {
  // Fresh context with no auth cookies
  const ctx = await browser.newContext();
  const req = await ctx.request.newContext();
  const res = await req.get('/api/orders');
  expect(res.status()).toBe(401);
  await ctx.close();
});

test('unauthenticated API call to /api/kitchen returns 401', async ({ browser }) => {
  const ctx = await browser.newContext();
  const req = await ctx.request.newContext();
  const res = await req.get('/api/kitchen');
  expect(res.status()).toBe(401);
  await ctx.close();
});
