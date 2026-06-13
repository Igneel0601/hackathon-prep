import { test, expect } from '@playwright/test';

test.describe('Auth — unauthenticated access', () => {
  test('/ redirects to /login when not logged in', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('/order redirects to /login when not logged in', async ({ page }) => {
    await page.goto('/order?tableId=anything');
    await expect(page).toHaveURL(/\/login/);
  });

  test('/kds redirects to /login when not logged in', async ({ page }) => {
    await page.goto('/kds');
    await expect(page).toHaveURL(/\/login/);
  });

  test('/orders redirects to /login when not logged in', async ({ page }) => {
    await page.goto('/orders');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Auth — login form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('renders Sign in form with email and password fields', async ({ page }) => {
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('shows error for wrong password — no redirect', async ({ page }) => {
    await page.getByLabel('Email').fill('cashier@test.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('shows error for non-existent email', async ({ page }) => {
    await page.getByLabel('Email').fill('nobody@nowhere.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
  });

  test('cashier login lands on POS home', async ({ page }) => {
    await page.getByLabel('Email').fill('cashier@test.com');
    await page.getByLabel('Password').fill('cashier123');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).not.toHaveURL(/\/login/, { timeout: 8000 });
    await expect(page.getByText(/cafe pos/i)).toBeVisible();
  });

  test('admin login succeeds', async ({ page }) => {
    await page.getByLabel('Email').fill('admin@test.com');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).not.toHaveURL(/\/login/, { timeout: 8000 });
  });

  test('sign in button is disabled while request is in flight', async ({ page }) => {
    await page.getByLabel('Email').fill('cashier@test.com');
    await page.getByLabel('Password').fill('cashier123');

    const btn = page.getByRole('button', { name: /sign in/i });
    await btn.click();

    // Button text should change to the loading indicator immediately
    await expect(page.getByRole('button', { name: '…' })).toBeVisible();
  });

  test('toggle to sign-up mode shows Name field', async ({ page }) => {
    await page.getByRole('button', { name: /need an account/i }).click();
    await expect(page.getByLabel('Name')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible();
  });

  test('sign-up with duplicate email shows error', async ({ page }) => {
    await page.getByRole('button', { name: /need an account/i }).click();
    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Email').fill('cashier@test.com'); // already exists
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /sign up/i }).click();

    await expect(page.getByText(/already exists/i)).toBeVisible({ timeout: 8000 });
  });
});
