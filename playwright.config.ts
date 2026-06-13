import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // concurrency tests need serial order
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,
  expect: { timeout: 8_000 },

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Setup project — runs global-setup to create auth state files
    {
      name: 'setup',
      testMatch: '**/global-setup.ts',
    },
    // Unauthenticated tests (auth redirects, login form)
    {
      name: 'unauth',
      testMatch: '**/auth.spec.ts',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    // Cashier (EMPLOYEE) tests
    {
      name: 'cashier',
      testMatch: ['**/order-flow.spec.ts', '**/kds.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/cashier.json',
      },
      dependencies: ['setup'],
    },
    // Admin tests
    {
      name: 'admin',
      testMatch: '**/admin.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/admin.json',
      },
      dependencies: ['setup'],
    },
    // Concurrency tests — uses raw API requests (no UI)
    {
      name: 'concurrency',
      testMatch: '**/concurrency.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/cashier.json',
      },
      dependencies: ['setup'],
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
