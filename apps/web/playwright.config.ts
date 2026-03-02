import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 *
 * IMPORTANT: Before running Playwright tests, the dev server must be running:
 *   cd apps/web && npm run dev
 *
 * In CI, add a "start server" step and a "wait-on http://localhost:3000" step
 * before running `npx playwright test`.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // webServer is intentionally omitted — start `npm run dev` manually before running tests.
});
