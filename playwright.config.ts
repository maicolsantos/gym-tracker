import { defineConfig, devices } from "@playwright/test"

/**
 * See https://playwright.dev/docs/test-configuration.
 * Adheres to guidelines in .claude/agents/e2e-runner.md
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3005",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    locale: "pt-BR",
    launchOptions: {
      slowMo: process.env.SLOWMO ? parseInt(process.env.SLOWMO, 10) : 0,
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "NEXT_DIST_DIR=.next-test bun run dev --port 3005",
    url: "http://localhost:3005",
    reuseExistingServer: false,
    timeout: 120 * 1000,
    env: {
      PORT: "3005",
      NEXT_DIST_DIR: ".next-test",
      NEXT_PUBLIC_USE_FIREBASE_EMULATOR: "true",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-gym-tracker",
      NEXT_PUBLIC_FIREBASE_API_KEY: "demo-api-key",
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "localhost",
    },
  },
})
