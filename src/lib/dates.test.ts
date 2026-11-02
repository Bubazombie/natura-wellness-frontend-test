import { describe, expect, it } from "vitest";
import { formatFullDate, formatShortDate, formatWeekdayDate, formatWhen } from "./dates";

// Tests run in America/New_York (see test-env.ts).
describe("date formatting", () => {
  it("formats the headline delivery date with the weekday", () => {
    expect(formatWeekdayDate("2026-11-08T15:00:00Z")).toBe("Sunday, November 8");
  });

  it("formats a compact date for sentences and buttons", () => {
    expect(formatShortDate("2026-11-08T15:00:00Z")).toBe("Nov 8");
  });

  it("formats a full date with the year", () => {
    expect(formatFullDate("2026-10-23T15:00:00Z")).toBe("October 23, 2026");
  });

  it("says today for an event earlier today, and the full date otherwise", () => {
    const now = new Date("2026-11-02T20:00:00Z");

    expect(formatWhen("2026-11-02T14:00:00Z", now)).toBe("today");
    expect(formatWhen("2026-11-01T14:00:00Z", now)).toBe("on November 1, 2026");
  });

  it("decides today in the customer's timezone, not UTC", () => {
    // 01:00 UTC on Nov 3 is still the evening of Nov 2 in New York.
    expect(formatWhen("2026-11-03T01:00:00Z", new Date("2026-11-02T20:00:00Z"))).toBe("today");
    expect(formatWhen("2026-11-02T03:00:00Z", new Date("2026-11-02T20:00:00Z"))).toBe("on November 1, 2026");
  });

  it("uses the customer's timezone, not UTC, near midnight", () => {
    // 03:00 UTC on Nov 9 is still the evening of Nov 8 in New York.
    expect(formatShortDate("2026-11-09T03:00:00Z")).toBe("Nov 8");
    expect(formatWeekdayDate("2026-11-09T03:00:00Z")).toBe("Sunday, November 8");
  });
});
