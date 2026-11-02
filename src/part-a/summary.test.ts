import { describe, expect, it } from "vitest";
import { fixtures } from "../api/fixtures";
import type { Subscription } from "../api/types";
import { dateAfterSkip, lineTotalCents, priceSummary } from "./summary";

describe("priceSummary", () => {
  it("uses the server's total and derives the saving from it, so the lines add up", () => {
    const summary = priceSummary(fixtures.active());

    // 1 x $29.95 + 2 x $44.95 = $119.85; the server charges round($119.85 x 0.85) = $101.87.
    expect(summary).toEqual({ subtotalCents: 11985, savingsCents: 1798, totalCents: 10187, itemCount: 3 });
    expect(summary.subtotalCents - summary.savingsCents).toBe(summary.totalCents);
  });

  it("computes the discounted total itself when the server has none (paused or cancelled)", () => {
    for (const subscription of [fixtures.paused(), fixtures.cancelled()]) {
      expect(subscription.nextChargeTotalCents).toBeNull();
      expect(priceSummary(subscription).totalCents).toBe(10187);
    }
  });

  it("handles a single item with no saving", () => {
    const subscription: Subscription = {
      ...fixtures.active(),
      items: [{ sku: "X", name: "X", quantity: 1, unitPriceCents: 1000, imageUrl: null }],
      discountPercent: 0,
      nextChargeTotalCents: null,
    };

    expect(priceSummary(subscription)).toEqual({ subtotalCents: 1000, savingsCents: 0, totalCents: 1000, itemCount: 1 });
  });
});

describe("dateAfterSkip", () => {
  it("moves the delivery one interval later", () => {
    expect(dateAfterSkip("2026-11-08T15:00:00.000Z", 30)).toBe("2026-12-08T15:00:00.000Z");
    expect(dateAfterSkip("2026-11-08T15:00:00.000Z", 60)).toBe("2027-01-07T15:00:00.000Z");
  });
});

describe("lineTotalCents", () => {
  it("multiplies the list price by the quantity", () => {
    expect(lineTotalCents({ sku: "X", name: "X", quantity: 2, unitPriceCents: 4495, imageUrl: null })).toBe(8990);
  });
});
