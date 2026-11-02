import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { expectNoAxeViolations } from "../test/axe";
import { LoadErrorView, LoadingView } from "./LoadStates";

describe("LoadingView", () => {
  it("announces that the subscription is loading, and hides the placeholder shapes", async () => {
    const screen = await render(<LoadingView />);

    await expect.element(screen.getByRole("status")).toHaveTextContent("Loading your subscription");
    expect(screen.container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it("only pulses when the customer allows motion", async () => {
    const screen = await render(<LoadingView />);
    const shape = screen.container.querySelector('[aria-hidden="true"] div');

    expect(shape?.className).toContain("motion-safe:animate-pulse");
    expect(shape?.className).not.toMatch(/(^|\s)animate-pulse/);
  });

  it("has no WCAG 2.2 AA violations", async () => {
    const screen = await render(<LoadingView />);

    await expectNoAxeViolations(screen.container);
  });
});

describe("LoadErrorView", () => {
  it("error: says nothing changed, and offers to try again and to email support", async () => {
    const onRetry = vi.fn();
    const screen = await render(<LoadErrorView failure="error" onRetry={onRetry} />);

    await expect.element(screen.getByRole("alert").getByRole("heading", { name: "We couldn't load your subscription" })).toBeVisible();
    await expect.element(screen.getByText("Nothing has changed with your subscription.", { exact: false })).toBeVisible();
    await screen.getByRole("button", { name: "Try again" }).click();
    expect(onRetry).toHaveBeenCalledOnce();
    await expect.element(screen.getByRole("link", { name: "help@natura-wellness.example" })).toHaveAttribute("href", "mailto:help@natura-wellness.example");
  });

  it("not found: says so and offers support, with no retry, since retrying won't help", async () => {
    const screen = await render(<LoadErrorView failure="not-found" onRetry={vi.fn()} />);

    await expect.element(screen.getByRole("alert").getByRole("heading", { name: "We couldn't find a subscription on your account" })).toBeVisible();
    await expect.element(screen.getByRole("button", { name: "Try again" })).not.toBeInTheDocument();
    await expect.element(screen.getByRole("link", { name: "help@natura-wellness.example" })).toBeVisible();
  });

  it("keeps the support address on one line, so it can't be misread at a line break", async () => {
    const screen = await render(<LoadErrorView failure="error" onRetry={vi.fn()} />);

    expect(getComputedStyle(screen.getByRole("link").element()).whiteSpace).toBe("nowrap");
  });

  it("has no WCAG 2.2 AA violations in either case", async () => {
    for (const failure of ["error", "not-found"] as const) {
      const screen = await render(<LoadErrorView failure={failure} onRetry={vi.fn()} />);
      await expectNoAxeViolations(screen.container);
      await screen.unmount();
    }
  });
});
