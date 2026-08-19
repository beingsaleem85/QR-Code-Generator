import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  // Serial, not parallel: this project has no disposable local/CI Supabase
  // instance (Docker is unavailable in this environment — see
  // docs/ARCHITECTURE.md's Module 3.16 section), so Journeys B-F run real
  // signups against the live, linked project. Supabase Auth's own signup
  // rate limiting throttles a burst of concurrent signups from one IP —
  // confirmed live: running all 6 journeys x 2 browser projects in parallel
  // (the default `workers`) made every auth-dependent journey time out,
  // while the exact same specs pass individually. One worker avoids that
  // burst entirely; it costs wall-clock time, not correctness.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["html", { open: "never" }], ["list"]],
  timeout: 30_000,
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox-desktop",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "chromium-mobile",
      use: { ...devices["Pixel 7"] },
    },
  ],
  // Reuses an already-running dev server (checked via baseURL) instead of
  // starting a second one — this project's dev server sometimes runs on a
  // fallback port (see docs/SESSION_HANDOFF.md), so `reuseExistingServer`
  // must stay true rather than assuming port 3000 is free.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
