import { describe, expect, it } from "vitest";
import { formatPrice } from "./money";

describe("formatPrice", () => {
  it.each([
    [2995, "$29.95"],
    [2546, "$25.46"],
    [5092, "$50.92"],
    [0, "$0.00"],
    [5, "$0.05"],
    [100, "$1.00"],
    [25460, "$254.60"],
    [123456, "$1,234.56"],
  ])("formats %i cents as %s", (cents, expected) => {
    expect(formatPrice(cents)).toBe(expected);
  });
});
