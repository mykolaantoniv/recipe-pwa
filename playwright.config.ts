import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testMatch: 'e2e-smoke.spec.ts',
  timeout: 30000,
  use: {
    baseURL: 'http://127.0.0.1:8788',
    headless: true,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
