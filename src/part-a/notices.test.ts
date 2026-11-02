import { describe, expect, it } from "vitest";
import { catalog, fixtures } from "../api/fixtures";
import type { Subscription } from "../api/types";
import { frequencyNotice, quantityNotice, skippedNotice, statusAnnouncement, swapNotice } from "./notices";

const active = (overrides: Partial<Subscription> = {}): Subscription => ({ ...fixtures.active(), nextChargeAt: "2026-12-08T15:00:00.000Z", ...overrides });

describe("notices", () => {
  it("skip: names the skipped delivery and the new next one", () => {
    expect(skippedNotice("2026-11-08T15:00:00.000Z", active())).toBe("Done. Your Nov 8 delivery is skipped. Your next delivery is Dec 8.");
  });

  it("frequency: says the next delivery is unchanged and what happens after", () => {
    expect(frequencyNotice(active({ intervalDays: 60 }))).toBe("Your Dec 8 delivery is unchanged. After that, you'll get a delivery every 60 days.");
  });

  it("frequency on a paused subscription: says it applies from now on", () => {
    expect(frequencyNotice({ ...fixtures.paused(), intervalDays: 90 })).toBe("From now on, you'll get a delivery every 90 days.");
  });

  it("quantity: states the new quantity and the new total", () => {
    const item = { sku: "NW-MULTI-30", name: "Multivitamin, 30 tablets", quantity: 1, unitPriceCents: 4495, imageUrl: null };
    expect(quantityNotice(item, active({ nextChargeTotalCents: 6367 }))).toBe("Done. You'll get 1 of Multivitamin, 30 tablets in each delivery, for $63.67 per delivery.");
  });

  it.each([
    [{ ...fixtures.paused(), pausedUntil: "2026-12-02T15:00:00.000Z" }, "Your deliveries are paused. They resume on Wednesday, December 2."],
    [{ ...fixtures.cancelled() }, "Your subscription is cancelled. You won't be charged again."],
    [active({ nextChargeAt: "2026-11-03T15:00:00.000Z" }), "Your subscription is active. Your next delivery is Tuesday, November 3."],
  ])("status change announcement %#", (after, expected) => {
    expect(statusAnnouncement(after)).toBe(expected);
  });

  it("swap: names both products", () => {
    const from = fixtures.active().items.at(0);
    const to = catalog.find((product) => product.sku === "NW-MAG-90");
    if (!from || !to) throw new Error("fixtures changed");
    expect(swapNotice(from, to)).toBe("Done. Magnesium, 90 capsules replaces Vitamin D, 60 softgels from your next delivery.");
  });
});
