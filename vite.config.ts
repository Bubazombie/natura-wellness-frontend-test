import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { playwright } from "@vitest/browser-playwright";
import { TEST_LOCALE, TEST_TIMEZONE } from "./test-env";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
          environment: "node",
          env: { TZ: TEST_TIMEZONE },
        },
      },
      {
        extends: true,
        test: {
          name: "browser",
          include: ["src/**/*.test.tsx"],
          setupFiles: ["src/test/setup-browser.ts"],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({
              contextOptions: { locale: TEST_LOCALE, timezoneId: TEST_TIMEZONE },
            }),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
