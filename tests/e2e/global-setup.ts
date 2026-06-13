import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const authDir = path.join(__dirname, '.auth');

setup('create cashier auth state', async ({ page }) => {
  fs.mkdirSync(authDir, { recursive: true });

  await page.goto('/login');
  await page.getByLabel('Email').fill('cashier@test.com');
  await page.getByLabel('Password').fill('cashier123');
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait until we're past the login page
  await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 });

  await page.context().storageState({ path: path.join(authDir, 'cashier.json') });
});

setup('create admin auth state', async ({ page }) => {
  fs.mkdirSync(authDir, { recursive: true });

  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@test.com');
  await page.getByLabel('Password').fill('admin123');
  await page.getByRole('button', { name: /sign in/i }).click();

  await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 });

  await page.context().storageState({ path: path.join(authDir, 'admin.json') });
});
