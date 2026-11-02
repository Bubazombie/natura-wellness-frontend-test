import { describe, expect, it } from "vitest";
import { clampQuantity, parseWholeNumber, resolveQuantity, validQuantity } from "./quantity";

const range = { min: 1, max: 10 };
const TOO_MANY = "You can order up to 10 at a time.";
const OUT_OF_RANGE = "Enter a quantity from 1 to 10.";

describe("parseWholeNumber", () => {
  it.each([
    ["3", 3],
    [" 7 ", 7],
    ["010", 10],
    ["0", 0],
    ["99", 99],
  ])("reads %j as %i", (text, expected) => {
    expect(parseWholeNumber(text)).toBe(expected);
  });

  it.each(["", "  ", "abc", "2a", "1.5", "-1", "+2", "1e1"])("rejects %j", (text) => {
    expect(parseWholeNumber(text)).toBeNull();
  });
});

describe("validQuantity", () => {
  it("accepts whole numbers within the range", () => {
    expect(validQuantity("1", range)).toBe(1);
    expect(validQuantity("10", range)).toBe(10);
  });

  it.each(["0", "11", "", "x"])("returns null for %j", (text) => {
    expect(validQuantity(text, range)).toBeNull();
  });
});

describe("clampQuantity", () => {
  it.each([
    [0, 1],
    [1, 1],
    [5, 5],
    [10, 10],
    [11, 10],
  ])("clamps %i to %i", (value, expected) => {
    expect(clampQuantity(value, range)).toBe(expected);
  });
});

describe("resolveQuantity", () => {
  it("keeps a valid entry with no message", () => {
    expect(resolveQuantity("4", 2, range)).toEqual({ value: 4, message: null });
  });

  it.each(["11", "25", "999"])("clamps %j to the maximum and says how many can be ordered", (text) => {
    expect(resolveQuantity(text, 2, range)).toEqual({ value: 10, message: TOO_MANY });
  });

  it("clamps 0 to the minimum and states the range", () => {
    expect(resolveQuantity("0", 4, range)).toEqual({ value: 1, message: OUT_OF_RANGE });
  });

  it.each(["", "abc", "1.5", "-3"])("keeps the current quantity for %j and states the range", (text) => {
    expect(resolveQuantity(text, 4, range)).toEqual({ value: 4, message: OUT_OF_RANGE });
  });
});
