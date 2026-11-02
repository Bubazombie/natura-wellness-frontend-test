import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { expectNoAxeViolations } from "../test/axe";
import { ProductSummary } from "./ProductSummary";

const props = { titleId: "title", eyebrow: "Vitamins", reviewCount: "12 reviews", title: "Vitamin D", subtitle: "One a day." };

const filledStars = (container: HTMLElement) => container.querySelectorAll("svg.text-star").length;

describe("ProductSummary", () => {
  it("renders the heading with the given id, for the region's accessible name", async () => {
    const screen = await render(<ProductSummary {...props} rating="4.8" />);

    await expect.element(screen.getByRole("heading", { level: 1, name: "Vitamin D" })).toHaveAttribute("id", "title");
  });

  it("states the rating in words and hides the decorative stars", async () => {
    const screen = await render(<ProductSummary {...props} rating="4.8" />);

    await expect.element(screen.getByText("Rated 4.8 out of 5")).toBeInTheDocument();
    for (const star of screen.container.querySelectorAll("svg")) expect(star.getAttribute("aria-hidden")).toBe("true");
  });

  it.each([
    ["4.8", 5],
    ["4.2", 4],
    ["3.5", 4],
    ["1.0", 1],
  ])("fills stars for a %s rating to the nearest whole star (%i)", async (rating, expected) => {
    const screen = await render(<ProductSummary {...props} rating={rating} />);

    expect(filledStars(screen.container)).toBe(expected);
    expect(screen.container.querySelectorAll("svg")).toHaveLength(5);
  });

  it("has no WCAG 2.2 AA violations", async () => {
    const screen = await render(<ProductSummary {...props} rating="4.8" />);

    await expectNoAxeViolations(screen.container);
  });
});
