import { describe, expect, it } from "vitest";
import { orderTotalCents, unitPriceCents } from "./pricing";

const prices = { oneTimeCents: 2995, subscribeCents: 2546 };

describe("unitPriceCents", () => {
  it("uses the subscription price when subscribing", () => {
    expect(unitPriceCents("subscribe", prices)).toBe(2546);
  });

  it("uses the full price for a one-time purchase", () => {
    expect(unitPriceCents("one-time", prices)).toBe(2995);
  });
});

describe("orderTotalCents", () => {
  it.each([
    ["subscribe", 1, 2546],
    ["subscribe", 2, 5092],
    ["subscribe", 10, 25460],
    ["one-time", 1, 2995],
    ["one-time", 3, 8985],
  ] as const)("%s x %i is %i cents", (option, quantity, expected) => {
    expect(orderTotalCents(option, quantity, prices)).toBe(expected);
  });
});
