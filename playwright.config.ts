import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e/hmr',

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // no retries because we have a setup
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    // for console logs
    ['list'],
    // to debug
    ['html'],
  ],
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    // baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    // {
    //   name: 'chromium',
    //   use: { ...devices['Desktop Chrome'] },
    // },
    //
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    //
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
})
