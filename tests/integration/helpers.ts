/**
 * Shared helpers for integration tests.
 * Each test suite calls setupIntegration() in beforeAll and teardown() in afterAll.
 * Individual tests push created order IDs to ctx.orderIds for per-test cleanup.
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '@/lib/db';

export interface IntegrationCtx {
  userId: string;
  sessionId: string;
  tableId: string;
  table2Id: string;
  products: { id: string; name: string; price: string; tax: string; sendToKitchen: boolean }[];
  kitchenProducts: { id: string; name: string; price: string; tax: string }[];
  orderIds: string[];
}

export async function setupIntegration(): Promise<IntegrationCtx> {
  const user = await db.user.findUniqueOrThrow({ where: { email: 'cashier@test.com' } });

  // Create a dedicated test session so we don't pollute live sessions
  const session = await db.posSession.create({ data: { userId: user.id } });

  const tables = await db.table.findMany({ where: { active: true }, orderBy: { number: 'asc' }, take: 2 });
  if (tables.length < 2) throw new Error('Need at least 2 active tables in seed data');

  const allProducts = await db.product.findMany({ where: { active: true } });
  if (!allProducts.length) throw new Error('Need seeded products');

  const kitchenProducts = allProducts.filter((p) => p.sendToKitchen);

  return {
    userId: user.id,
    sessionId: session.id,
    tableId: tables[0].id,
    table2Id: tables[1].id,
    products: allProducts.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price.toString(),
      tax: p.tax.toString(),
      sendToKitchen: p.sendToKitchen,
    })),
    kitchenProducts: kitchenProducts.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price.toString(),
      tax: p.tax.toString(),
    })),
    orderIds: [],
  };
}

export async function teardownIntegration(ctx: IntegrationCtx) {
  // Delete test session — cascades to all orders/items/payments created under it
  await db.posSession.delete({ where: { id: ctx.sessionId } }).catch(() => null);
}

/** Build a POST /api/orders Request using the test session's user */
export function makeOrderReq(body: object): Request {
  return new Request('http://localhost/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** Build a POST /api/orders/:id/kitchen Request */
export function makeKitchenReq(orderId: string, action: 'send' | 'advance'): Request {
  return new Request(`http://localhost/api/orders/${orderId}/kitchen`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
}

/** Build a POST /api/orders/:id/payment Request */
export function makePaymentReq(orderId: string, body: object): Request {
  return new Request(`http://localhost/api/orders/${orderId}/payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** Build a GET /api/kitchen Request */
export function makeKitchenGetReq(status?: string): Request {
  const url = status
    ? `http://localhost/api/kitchen?status=${status}`
    : 'http://localhost/api/kitchen';
  return new Request(url);
}

/** Directly insert an order into the test session, bypassing the API */
export async function seedOrder(
  ctx: IntegrationCtx,
  kitchenStatus: 'NONE' | 'TO_COOK' | 'PREPARING' | 'COMPLETED' = 'NONE',
) {
  const product = ctx.kitchenProducts[0] ?? ctx.products[0];
  const order = await db.order.create({
    data: {
      tableId: ctx.tableId,
      sessionId: ctx.sessionId,
      subtotal: product.price,
      tax: (parseFloat(product.price) * parseFloat(product.tax)) / 100,
      discount: 0,
      total:
        parseFloat(product.price) +
        (parseFloat(product.price) * parseFloat(product.tax)) / 100,
      kitchenStatus,
      items: {
        create: {
          productId: product.id,
          name: product.name,
          unitPrice: product.price,
          qty: 1,
          lineTotal: product.price,
        },
      },
    },
  });
  ctx.orderIds.push(order.id);
  return order;
}
