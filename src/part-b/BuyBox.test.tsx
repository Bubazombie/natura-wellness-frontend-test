import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { expectNoAxeViolations } from "../test/axe";
import { BuyBox, MAX_QUANTITY } from "./BuyBox";
import { copy } from "./copy";

describe("BuyBox", () => {
  it("is a region named after the product, with the product name as the page heading", async () => {
    const screen = await render(<BuyBox />);

    await expect.element(screen.getByRole("region", { name: "Vitamin D" })).toBeVisible();
    await expect.element(screen.getByRole("heading", { level: 1, name: "Vitamin D" })).toBeVisible();
    await expect.element(screen.getByRole("img", { name: "Vitamin D bottle, 60 softgels" })).toBeVisible();
  });

  it("starts with subscribe selected, 30 days, quantity 1, matching the reference", async () => {
    const screen = await render(<BuyBox />);

    await expect.element(screen.getByRole("radio", { name: /Subscribe & save 15%/ })).toBeChecked();
    await expect.element(screen.getByRole("radio", { name: /One-time purchase/ })).not.toBeChecked();
    await expect.element(screen.getByRole("combobox", { name: "Delivered every" })).toHaveValue("30 days");
    await expect.element(screen.getByRole("textbox", { name: "Quantity" })).toHaveValue("1");
    await expect.element(screen.getByRole("button", { name: "Add to cart $25.46" })).toBeVisible();
    await expect.element(screen.getByText(copy.finePrint)).toBeVisible();
  });

  it("names the radios with their prices, and announces the struck price as the regular price", async () => {
    const screen = await render(<BuyBox />);

    await expect.element(screen.getByRole("radio", { name: "One-time purchase $29.95" })).toBeVisible();
    await expect
      .element(screen.getByRole("radio", { name: "Subscribe & save 15% Best value $25.46 Regular price $29.95" }))
      .toBeVisible();
  });

  it("shows the rating as text for assistive technology and links to the reviews", async () => {
    const screen = await render(<BuyBox />);

    await expect.element(screen.getByText("Rated 4.8 out of 5")).toBeInTheDocument();
    await expect.element(screen.getByRole("link", { name: "2,316 reviews" })).toHaveAttribute("href", "#reviews");
  });

  it("lists the subscription perks and the trust badges", async () => {
    const screen = await render(<BuyBox />);

    for (const text of [...copy.subscribe.perks, ...copy.trust]) {
      await expect.element(screen.getByRole("listitem").filter({ hasText: text })).toBeVisible();
    }
  });

  it("switching to one-time updates the total, and hides the frequency, perks and renewal fine print", async () => {
    const screen = await render(<BuyBox />);

    await screen.getByRole("radio", { name: /One-time purchase/ }).click();

    await expect.element(screen.getByRole("button", { name: "Add to cart $29.95" })).toBeVisible();
    await expect.element(screen.getByRole("combobox", { name: "Delivered every" })).not.toBeInTheDocument();
    await expect.element(screen.getByText(copy.subscribe.perks[0])).not.toBeInTheDocument();
    await expect.element(screen.getByText(/renews every/)).not.toBeInTheDocument();
  });

  it("keeps the fine print in step with the frequency and quantity", async () => {
    const screen = await render(<BuyBox />);

    await screen.getByRole("combobox", { name: "Delivered every" }).selectOptions("60 days");
    await screen.getByRole("button", { name: "Increase quantity" }).click();

    await expect.element(screen.getByRole("button", { name: "Add to cart $50.92" })).toBeVisible();
    await expect.element(screen.getByText(/renews every 60 days at \$50\.92 until you cancel/)).toBeVisible();
  });

  it("stops the quantity at 1 and at the maximum", async () => {
    const screen = await render(<BuyBox />);
    const decrease = screen.getByRole("button", { name: "Decrease quantity" });
    const increase = screen.getByRole("button", { name: "Increase quantity" });

    const quantity = screen.getByRole("textbox", { name: "Quantity" });

    await expect.element(decrease).toHaveAttribute("aria-disabled", "true");
    // force: Playwright treats aria-disabled as disabled and would wait; a real user can still click it.
    await decrease.click({ force: true });
    await expect.element(quantity).toHaveValue("1");

    for (let i = 1; i < MAX_QUANTITY; i++) await increase.click();
    await expect.element(quantity).toHaveValue(String(MAX_QUANTITY));
    await expect.element(increase).toHaveAttribute("aria-disabled", "true");
    await increase.click({ force: true });
    await expect.element(quantity).toHaveValue(String(MAX_QUANTITY));
    await expect.element(decrease).toHaveAttribute("aria-disabled", "false");
  });

  it("has no WCAG 2.2 AA violations, including color contrast, in both purchase states", async () => {
    const screen = await render(<BuyBox />);
    await expectNoAxeViolations(screen.container);

    await screen.getByRole("radio", { name: /One-time purchase/ }).click();
    await expectNoAxeViolations(screen.container);
  });
});
