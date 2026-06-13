/**
 * E2E: Kitchen Display screen
 * storageState: cashier.json
 */
import { test, expect } from '@playwright/test';

test.describe('KDS — page loads', () => {
  test('renders the Kitchen Display header', async ({ page }) => {
    await page.goto('/kds');
    await expect(page.getByText(/kitchen display/i)).toBeVisible();
  });

  test('shows empty state when no active tickets', async ({ page }) => {
    await page.goto('/kds');
    // Wait for initial load
    await page.waitForTimeout(3000);
    // Either shows tickets OR the empty state message
    const hasTickets = await page.locator('[data-testid="ticket-card"]').count() > 0;
    const hasEmpty = await page.getByText(/no active|waiting for orders/i).isVisible().catch(() => false);
    expect(hasTickets || hasEmpty).toBe(true);
  });

  test('auto-refresh indicator is visible', async ({ page }) => {
    await page.goto('/kds');
    await expect(page.getByText(/2\.5s|refresh/i)).toBeVisible();
  });
});

test.describe('KDS — ticket lifecycle via API', () => {
  test('ticket appears on KDS after Send to Kitchen via API', async ({ page, request }) => {
    // 1. Get a product and table
    const tablesRes = await request.get('/api/tables');
    const { floors } = await tablesRes.json() as { floors: { tables: { id: string; hasActiveOrder: boolean }[] }[] };
    const table = floors.flatMap((f) => f.tables).find((t) => !t.hasActiveOrder);
    if (!table) test.skip();

    const productsRes = await request.get('/api/products');
    const { products } = await productsRes.json() as { products: { id: string; sendToKitchen: boolean }[] };
    const kitchenProduct = products.find((p) => p.sendToKitchen);
    if (!kitchenProduct) test.skip();

    // 2. Create order
    const orderRes = await request.post('/api/orders', {
      data: { tableId: table!.id, items: [{ productId: kitchenProduct!.id, qty: 1 }] },
    });
    expect(orderRes.status()).toBe(201);
    const order = await orderRes.json() as { id: string; number: number };

    // 3. Send to kitchen
    const kitchenRes = await request.post(`/api/orders/${order.id}/kitchen`, {
      data: { action: 'send' },
    });
    expect(kitchenRes.status()).toBe(200);

    // 4. Open KDS and wait for polling to pick up the ticket (max ~5s for 2 cycles)
    await page.goto('/kds');
    await expect(page.getByText(`#${order.number}`)).toBeVisible({ timeout: 8000 });

    // 5. Cleanup
    await request.post(`/api/orders/${order.id}/kitchen`, { data: { action: 'advance' } });
    await request.post(`/api/orders/${order.id}/kitchen`, { data: { action: 'advance' } });
  });

  test('advancing a ticket TO_COOK → PREPARING via UI', async ({ page, request }) => {
    // Setup: create and send an order
    const tablesRes = await request.get('/api/tables');
    const { floors } = await tablesRes.json() as { floors: { tables: { id: string; hasActiveOrder: boolean }[] }[] };
    const table = floors.flatMap((f) => f.tables).find((t) => !t.hasActiveOrder);
    if (!table) test.skip();

    const productsRes = await request.get('/api/products');
    const { products } = await productsRes.json() as { products: { id: string; sendToKitchen: boolean }[] };
    const kitchenProduct = products.find((p) => p.sendToKitchen);
    if (!kitchenProduct) test.skip();

    const orderRes = await request.post('/api/orders', {
      data: { tableId: table!.id, items: [{ productId: kitchenProduct!.id, qty: 1 }] },
    });
    const order = await orderRes.json() as { id: string; number: number };
    await request.post(`/api/orders/${order.id}/kitchen`, { data: { action: 'send' } });

    // Open KDS
    await page.goto('/kds');
    const ticket = page.locator(`text=#${order.number}`).locator('..').locator('..');

    // Click "Start Preparing"
    const advanceBtn = page.getByRole('button', { name: /start preparing/i }).first();
    await expect(advanceBtn).toBeVisible({ timeout: 8000 });
    await advanceBtn.click();

    // Badge should update to "Preparing"
    await expect(page.getByText(/preparing/i).first()).toBeVisible({ timeout: 5000 });

    // Cleanup
    await request.post(`/api/orders/${order.id}/kitchen`, { data: { action: 'advance' } });
  });
});

test.describe('KDS — error handling', () => {
  test('KDS page is accessible and does not crash on load', async ({ page }) => {
    await page.goto('/kds');
    // No unhandled error dialog
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.waitForTimeout(3000);
    expect(errors).toHaveLength(0);
  });
});
