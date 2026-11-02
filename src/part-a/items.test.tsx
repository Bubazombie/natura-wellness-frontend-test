// ItemList and PriceSummary: what's in the subscription and what it costs.
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { fixtures } from "../api/fixtures";
import { expectNoAxeViolations } from "../test/axe";
import { ItemList } from "./ItemList";
import { PriceSummary } from "./PriceSummary";
import { priceSummary } from "./summary";

describe("ItemList", () => {
  it("lists each item with its quantity, unit price and line total", async () => {
    const screen = await render(<ItemList items={fixtures.active().items} />);
    const rows = screen.getByRole("listitem");

    expect(rows.nth(0).element().textContent).toContain("Vitamin D, 60 softgelsQty 1 · $29.95 each$29.95");
    expect(rows.nth(1).element().textContent).toContain("Multivitamin, 30 tabletsQty 2 · $44.95 each$89.90");
  });

  it("shows the product photo as decoration next to the name", async () => {
    const screen = await render(<ItemList items={fixtures.active().items} />);
    const image = screen.container.querySelector("img");

    expect(image?.getAttribute("src")).toBe("/product.jpg");
    expect(image?.getAttribute("alt")).toBe("");
  });

  it("shows a lettered placeholder, hidden from assistive technology, when there is no image", async () => {
    const screen = await render(<ItemList items={[{ sku: "M", name: "Magnesium, 90 capsules", quantity: 1, unitPriceCents: 2495, imageUrl: null }]} />);
    const placeholder = screen.getByText("M", { exact: true });

    await expect.element(placeholder).toHaveAttribute("aria-hidden", "true");
    expect(screen.container.querySelector("img")).toBeNull();
  });

  it("has no WCAG 2.2 AA violations", async () => {
    const screen = await render(<ItemList items={fixtures.active().items} />);

    await expectNoAxeViolations(screen.container);
  });
});

describe("PriceSummary", () => {
  it("shows the subtotal, the saving, free shipping and the server's total, which add up", async () => {
    const subscription = fixtures.active();
    const screen = await render(<PriceSummary summary={priceSummary(subscription)} discountPercent={subscription.discountPercent} />);
    const text = screen.container.textContent;

    expect(text).toContain("Subtotal$119.85");
    expect(text).toContain("Subscription savings (15%)−$17.98");
    expect(text).toContain("ShippingFree");
    expect(text).toContain("Total per delivery$101.87");
  });

  it("has no WCAG 2.2 AA violations", async () => {
    const subscription = fixtures.active();
    const screen = await render(<PriceSummary summary={priceSummary(subscription)} discountPercent={subscription.discountPercent} />);

    await expectNoAxeViolations(screen.container);
  });
});
