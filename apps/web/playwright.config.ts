import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// This sandboxed dev environment ships a pinned Chromium build outside
// Playwright's own download cache (see /opt/pw-browsers) and has no network
// access to fetch a matching one. Point at it directly when present; CI and
// other machines fall back to Playwright's normal browser resolution.
const pinnedChromiumPath = "/opt/pw-browsers/chromium";
const executablePath = existsSync(pinnedChromiumPath) ? pinnedChromiumPath : undefined;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(executablePath ? { launchOptions: { executablePath } } : {}),
      },
    },
  ],
  webServer: {
    command: "pnpm exec next build && pnpm exec next start -p 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
