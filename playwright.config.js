import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:3005',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npx serve . -l 3005',
    url: 'http://127.0.0.1:3005',
    reuseExistingServer: !process.env.CI,
    timeout: 15000,
  },
});
