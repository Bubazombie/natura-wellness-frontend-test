import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { App } from "./App";
import { expectNoAxeViolations } from "./test/axe";
import { TEST_LOCALE, TEST_TIMEZONE } from "../test-env";

describe("App", () => {
  it("links to both parts of the test", async () => {
    const screen = await render(<App />);

    await expect.element(screen.getByRole("link", { name: "Part A: Subscription page" })).toHaveAttribute("href", "?part=a&fixture=active");
    await expect.element(screen.getByRole("link", { name: "Part B: Buy box" })).toHaveAttribute("href", "?part=b");
  });

  it("has no WCAG 2.2 AA violations", async () => {
    const screen = await render(<App />);

    await expectNoAxeViolations(screen.container);
  });

  it("runs in the pinned browser locale and timezone", () => {
    const { locale, timeZone } = Intl.DateTimeFormat().resolvedOptions();
    expect({ locale, timeZone }).toEqual({ locale: TEST_LOCALE, timeZone: TEST_TIMEZONE });
  });
});
