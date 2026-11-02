import { describe, expect, it } from "vitest";
import { catalog, fixtures } from "../api/fixtures";
import type { SubscriptionItem } from "../api/types";
import { BUNDLE_CONTENTS } from "./content";
import { swapOptions } from "./swaps";

const pairs = (items: SubscriptionItem[]) => swapOptions(items, catalog, BUNDLE_CONTENTS).map(({ from, to }) => `${from.sku} -> ${to.sku}`);

describe("swapOptions", () => {
  it("offers each item in the subscription, so the customer chooses which one to swap", () => {
    expect(pairs(fixtures.active().items)).toEqual(["NW-VITD-60 -> NW-MAG-90", "NW-MULTI-30 -> NW-MAG-90"]);
  });

  it("never offers a bundle that contains the product being replaced", () => {
    expect(pairs(fixtures.active().items).some((pair) => pair.endsWith("NW-ESSENTIALS"))).toBe(false);
  });

  it("never offers a product the customer already has", () => {
    const vitaminD = fixtures.active().items.at(0);
    if (!vitaminD) throw new Error("fixture changed");
    expect(pairs([vitaminD])).toEqual(["NW-VITD-60 -> NW-MULTI-30", "NW-VITD-60 -> NW-MAG-90"]);
  });

  it("offers the bundle in place of a product it doesn't contain", () => {
    const other: SubscriptionItem = { sku: "NW-OTHER", name: "Omega-3", quantity: 1, unitPriceCents: 1995, imageUrl: null };
    expect(pairs([other])).toContain("NW-OTHER -> NW-ESSENTIALS");
  });

  it("offers nothing when every product is already in the subscription", () => {
    const everything = catalog.map((product) => ({ ...product, quantity: 1 }));
    expect(pairs(everything)).toEqual([]);
  });
});
