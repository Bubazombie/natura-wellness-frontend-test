import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { AppNav } from "./AppNav";
import { expectNoAxeViolations } from "./test/axe";

describe("AppNav", () => {
  it("is a labelled navigation with a link to each part", async () => {
    const screen = await render(<AppNav current="a" />);
    const nav = screen.getByRole("navigation", { name: "Test parts" });

    await expect.element(nav.getByRole("link", { name: "Part A: Subscription page" })).toHaveAttribute("href", "?part=a&fixture=active");
    await expect.element(nav.getByRole("link", { name: "Part B: Buy box" })).toHaveAttribute("href", "?part=b");
  });

  it.each([
    ["a", "Part A: Subscription page", "Part B: Buy box"],
    ["b", "Part B: Buy box", "Part A: Subscription page"],
  ] as const)("marks only the current part (%s) with aria-current", async (current, active, other) => {
    const screen = await render(<AppNav current={current} />);

    await expect.element(screen.getByRole("link", { name: active })).toHaveAttribute("aria-current", "page");
    await expect.element(screen.getByRole("link", { name: other })).not.toHaveAttribute("aria-current");
  });

  it("styles the current part differently from the other", async () => {
    const screen = await render(<AppNav current="b" />);
    const background = (name: string) => getComputedStyle(screen.getByRole("link", { name }).element()).backgroundColor;

    expect(background("Part B: Buy box")).toBe("rgb(23, 64, 47)");
    expect(background("Part A: Subscription page")).not.toBe(background("Part B: Buy box"));
  });

  it("has link targets at least 44px tall", async () => {
    const screen = await render(<AppNav current="a" />);

    for (const link of screen.getByRole("link").elements()) {
      expect(link.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    }
  });

  it("has no WCAG 2.2 AA violations in either state", async () => {
    const onA = await render(<AppNav current="a" />);
    await expectNoAxeViolations(onA.container);
    await onA.unmount();

    const onB = await render(<AppNav current="b" />);
    await expectNoAxeViolations(onB.container);
  });
});
