import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { config } from 'dotenv';

// Load .env.local so DATABASE_URL is available for Prisma
config({ path: '.env.local' });

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/integration/**/*.test.ts'],
    timeout: 30_000,
    hookTimeout: 30_000,
    // Run integration tests serially — they share the Neon DB
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
  },
  resolve: {
    alias: { '@': resolve(__dirname, './src') },
  },
});
