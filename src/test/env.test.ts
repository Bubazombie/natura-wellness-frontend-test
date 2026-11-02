import { describe, expect, it } from "vitest";
import { TEST_LOCALE, TEST_TIMEZONE } from "../../test-env";

describe("unit test environment", () => {
  it("runs in the pinned timezone so date tests are deterministic", () => {
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe(TEST_TIMEZONE);
  });

  it("formats dates in the pinned zone, not UTC", () => {
    // 02:00 UTC on Jan 15 is still Jan 14 in New York.
    const date = new Date("2026-01-15T02:00:00Z");
    expect(date.toLocaleDateString(TEST_LOCALE)).toBe("1/14/2026");
  });
});
