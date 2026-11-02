import { describe, expect, it } from "vitest";
import { copy } from "./copy";
import { buildFinePrint } from "./finePrint";

describe("buildFinePrint", () => {
  it("matches the provided copy for the default selection, so the wording can't drift", () => {
    const [defaultFrequency] = copy.subscribe.frequencyOptions;
    expect(buildFinePrint(defaultFrequency, copy.subscribe.priceCents)).toBe(copy.finePrint);
  });

  it("states the actual frequency and total that will be charged", () => {
    expect(buildFinePrint("60 days", 5092)).toBe(
      "Your subscription renews every 60 days at $50.92 until you cancel. Skip or cancel anytime from your account.",
    );
  });
});
