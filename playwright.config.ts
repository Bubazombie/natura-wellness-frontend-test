import { defineConfig, devices } from "@playwright/test";
import { TEST_LOCALE, TEST_TIMEZONE } from "./test-env";

const PORT = 5173;
const BASE_URL = `http://localhost:${String(PORT)}`;
const VISUAL_TESTS = /\.visual\.spec\.ts$/;
const SWEEP_TESTS = /\.sweep\.spec\.ts$/;

export default defineConfig({
  testDir: "e2e",
  // The mock API waits up to 2.5s per request, so allow for a few round trips per test.
  timeout: 30_000,
  use: {
    baseURL: BASE_URL,
    locale: TEST_LOCALE,
    timezoneId: TEST_TIMEZONE,
    trace: "retain-on-failure",
  },
  testIgnore: [VISUAL_TESTS, SWEEP_TESTS],
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
    { name: "mobile-375", use: { ...devices["Desktop Chrome"], viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true } },
    { name: "mobile-320", use: { ...devices["Desktop Chrome"], viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true } },
    // WebKit emulation is our only iOS Safari coverage; it doesn't replace a real iPhone.
    { name: "iphone-375", use: devices["iPhone SE (3rd gen)"] },
    { name: "iphone-320", use: devices["iPhone SE"] },
    // Width sweeps resize the viewport themselves, so they run once per engine rather than per device.
    { name: "sweep-chromium", testIgnore: [], testMatch: SWEEP_TESTS, use: devices["Desktop Chrome"] },
    { name: "sweep-webkit", testIgnore: [], testMatch: SWEEP_TESTS, use: devices["Desktop Safari"] },
    // Matches how public/reference/buy-box.png was captured.
    {
      name: "visual",
      testIgnore: [],
      testMatch: VISUAL_TESTS,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1200, height: 780 }, deviceScaleFactor: 2 },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${String(PORT)} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: true,
  },
});
