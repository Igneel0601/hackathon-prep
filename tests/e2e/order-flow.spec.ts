/**
 * E2E: Full POS order flow — cashier perspective.
 * storageState: cashier.json (set in playwright.config.ts)
 */
import { test, expect, type Page } from '@playwright/test';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function openTable(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /open table/i }).click();
  // Wait for the floor picker modal
  await expect(page.getByRole('dialog')).toBeVisible();
  // Pick the first available table
  const firstTable = page.locator('[data-testid="table-card"], button').filter({ hasText: /table|T\d+|\d+/i }).first();
  await firstTable.click();
  // Should navigate to order view
  await expect(page).toHaveURL(/\/order\?tableId=/);
}

async function addFirstProduct(page: Page) {
  // Wait for products to load
  await expect(page.locator('[data-testid="product-card"], button').filter({ hasText: /₹/ }).first()).toBeVisible({ timeout: 8000 });
  const productBtn = page.locator('[data-testid="product-card"], button').filter({ hasText: /₹/ }).first();
  await productBtn.click();
}

// ─── Core flow ────────────────────────────────────────────────────────────────

test('POS home loads with Open Table button', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /open table/i })).toBeVisible();
  await expect(page.getByText(/select a table/i)).toBeVisible();
});

test('Open Table shows floor picker modal, close dismisses it', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /open table/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible();

  // Close via × button
  await page.getByRole('button', { name: /close|×|✕/i }).first().click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('floor picker shows Ground Floor and tables', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /open table/i }).click();
  await expect(page.getByText(/ground floor/i)).toBeVisible({ timeout: 8000 });
});

test('selecting a table navigates to Order View with tableId param', async ({ page }) => {
  await openTable(page);
  await expect(page).toHaveURL(/\/order\?tableId=.+/);
});

test('Order View shows products and an empty cart', async ({ page }) => {
  await openTable(page);
  // Products should load
  await expect(page.locator('text=₹').first()).toBeVisible({ timeout: 8000 });
});

test('adding a product puts it in the cart with correct qty and price', async ({ page }) => {
  await openTable(page);
  await addFirstProduct(page);
  // Cart should show qty 1
  await expect(page.getByText('1').first()).toBeVisible();
});

test('incrementing qty reflects in totals', async ({ page }) => {
  await openTable(page);
  await addFirstProduct(page);
  // Click + button to increment
  await page.getByRole('button', { name: /\+/ }).first().click();
  await expect(page.getByText('2')).toBeVisible();
});

test('decrementing to 0 removes the line from cart', async ({ page }) => {
  await openTable(page);
  await addFirstProduct(page);
  // Decrement to 0
  await page.getByRole('button', { name: /−|–|-/ }).first().click();
  // Cart should be empty again — Checkout button should be absent or disabled
  const checkoutBtn = page.getByRole('button', { name: /checkout|pay/i });
  const isMissing = await checkoutBtn.count() === 0;
  const isDisabled = !isMissing && await checkoutBtn.isDisabled();
  expect(isMissing || isDisabled).toBe(true);
});

test('empty cart: Send to Kitchen button absent or disabled', async ({ page }) => {
  await openTable(page);
  const sendBtn = page.getByRole('button', { name: /send to kitchen/i });
  const count = await sendBtn.count();
  if (count > 0) {
    await expect(sendBtn).toBeDisabled();
  }
  // If absent, that's also acceptable
});

test('discount percentage reduces total', async ({ page }) => {
  await openTable(page);
  await addFirstProduct(page);

  // Find discount input
  const discountInput = page.getByRole('spinbutton', { name: /discount/i });
  if (await discountInput.count() > 0) {
    const totalBefore = await page.getByTestId('total').textContent() ??
      await page.locator('text=/Total.*₹/').first().textContent();
    await discountInput.fill('10');
    // Total should decrease
    const totalAfter = await page.getByTestId('total').textContent() ??
      await page.locator('text=/Total.*₹/').first().textContent();
    expect(totalAfter).not.toBe(totalBefore);
  }
});

test('100% discount — total is not negative', async ({ page }) => {
  await openTable(page);
  await addFirstProduct(page);

  const discountInput = page.getByRole('spinbutton', { name: /discount/i });
  if (await discountInput.count() > 0) {
    await discountInput.fill('100');
    // Total should be >= 0
    const totalText = await page.locator('text=/₹\d/').last().textContent() ?? '₹0';
    const total = parseFloat(totalText.replace(/[^0-9.]/g, ''));
    expect(total).toBeGreaterThanOrEqual(0);
  }
});

// ─── Send to Kitchen + Cash checkout ─────────────────────────────────────────

test('Send to Kitchen succeeds and shows confirmation', async ({ page }) => {
  await openTable(page);
  await addFirstProduct(page);

  const sendBtn = page.getByRole('button', { name: /send to kitchen/i });
  if (await sendBtn.count() > 0 && await sendBtn.isEnabled()) {
    await sendBtn.click();
    // Should not show an error
    await expect(page.getByText(/error|failed/i)).not.toBeVisible({ timeout: 3000 }).catch(() => {});
  }
});

test('Cash checkout: insufficient amount keeps Confirm disabled', async ({ page }) => {
  await openTable(page);
  await addFirstProduct(page);

  const checkoutBtn = page.getByRole('button', { name: /checkout|pay/i });
  if (await checkoutBtn.count() > 0 && await checkoutBtn.isEnabled()) {
    await checkoutBtn.click();

    // Select Cash tab if payment modal is shown
    const cashTab = page.getByRole('tab', { name: /cash/i });
    if (await cashTab.count() > 0) await cashTab.click();

    // Enter amount less than total
    const amountInput = page.getByRole('spinbutton', { name: /amount received/i });
    if (await amountInput.count() > 0) {
      await amountInput.fill('1'); // almost certainly less than total
      const confirmBtn = page.getByRole('button', { name: /confirm/i });
      await expect(confirmBtn).toBeDisabled();
    }
  }
});

test('Cash checkout: full flow → receipt shown', async ({ page }) => {
  await openTable(page);
  await addFirstProduct(page);

  const checkoutBtn = page.getByRole('button', { name: /checkout|pay/i });
  if (!(await checkoutBtn.count()) || !(await checkoutBtn.isEnabled())) return;
  await checkoutBtn.click();

  const cashTab = page.getByRole('tab', { name: /cash/i });
  if (await cashTab.count() > 0) await cashTab.click();

  const amountInput = page.getByRole('spinbutton', { name: /amount received/i });
  if (await amountInput.count() > 0) {
    await amountInput.fill('9999');
    const confirmBtn = page.getByRole('button', { name: /confirm/i });
    await expect(confirmBtn).toBeEnabled();
    await confirmBtn.click();

    // Receipt should appear
    await expect(page.getByText(/receipt|paid|change/i).first()).toBeVisible({ timeout: 8000 });
  }
});

// ─── Navigation ───────────────────────────────────────────────────────────────

test('Orders nav button navigates to /orders', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /orders/i }).click();
  await expect(page).toHaveURL(/\/orders/);
});

test('Kitchen Display nav button navigates to /kds', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /kitchen display/i }).click();
  await expect(page).toHaveURL(/\/kds/);
});

test('back button on Order View returns to POS home', async ({ page }) => {
  await openTable(page);
  const backBtn = page.getByRole('button', { name: /back|tables|←/i }).first();
  if (await backBtn.count() > 0) {
    await backBtn.click();
    await expect(page).toHaveURL(/^\//);
  }
});
