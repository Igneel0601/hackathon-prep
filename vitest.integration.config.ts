import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { config } from 'dotenv';

// Load .env.local in the main process and pass parsed vars to workers via test.env
// Try .env.local first (Next.js convention), fall back to .env
const { parsed: localEnv = {} } = config({ path: '.env.local' });
if (Object.keys(localEnv).length === 0) {
  const { parsed: dotEnv = {} } = config({ path: '.env' });
  Object.assign(localEnv, dotEnv);
}

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/integration/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // Pass env vars into worker processes (they don't inherit dotenv side-effects)
    env: localEnv as Record<string, string>,
    // Run files serially (maxWorkers:1) — shared Neon DB, same test user across
    // files causes getOpenPosSession to pick up the wrong session if files run in parallel
    maxWorkers: 1,
    sequence: { concurrent: false },
  },
  resolve: {
    alias: { '@': resolve(__dirname, './src') },
  },
});
