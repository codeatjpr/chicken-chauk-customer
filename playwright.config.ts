import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!import.meta.env.CI,
  retries: import.meta.env.CI ? 1 : 0,
  workers: import.meta.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: import.meta.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5173',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !import.meta.env.CI,
    timeout: 120_000,
  },
})
