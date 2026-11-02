import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { fixtures } from "../api/fixtures";
import type { Subscription } from "../api/types";
import { expectNoAxeViolations } from "../test/axe";
import { SubscriptionPage } from "./SubscriptionPage";

const actions = () => ({
  onSkip: vi.fn(),
  onResume: vi.fn(),
  onRestart: vi.fn(),
  onFrequencyChange: vi.fn(),
  onPause: vi.fn(),
  onCancel: vi.fn(),
});

const headings = (container: HTMLElement) => [...container.querySelectorAll("h1, h2")].map((h) => h.textContent);

async function renderPage(subscription: Subscription, notice?: string) {
  const handlers = actions();
  const screen = await render(<SubscriptionPage subscription={subscription} notice={notice} {...handlers} />);
  return { screen, ...handlers };
}

describe("SubscriptionPage", () => {
  it("active: leads with the next delivery, then the items, then managing the subscription", async () => {
    const { screen } = await renderPage(fixtures.active());

    expect(headings(screen.container)).toEqual(["Your subscription", "Next delivery", "In your next delivery", "Manage your subscription"]);
    await expect.element(screen.getByText("Active")).toBeVisible();
  });

  it("active: offers pause and cancel at the bottom, and reports them", async () => {
    const { screen, onPause, onCancel, onFrequencyChange } = await renderPage(fixtures.active());

    await screen.getByRole("button", { name: "Pause deliveries" }).click();
    await screen.getByRole("button", { name: "Cancel subscription" }).click();
    await screen.getByRole("combobox", { name: "Delivery frequency" }).selectOptions("Every 90 days");

    expect(onPause).toHaveBeenCalledOnce();
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onFrequencyChange).toHaveBeenCalledWith(90);
  });

  it("paused: offers no skip and no pause, but still offers cancel", async () => {
    const { screen } = await renderPage(fixtures.paused());

    expect(headings(screen.container)).toEqual(["Your subscription", "Your deliveries are paused", "In your subscription", "Manage your subscription"]);
    await expect.element(screen.getByRole("button", { name: "Skip this delivery" })).not.toBeInTheDocument();
    await expect.element(screen.getByRole("button", { name: "Pause deliveries" })).not.toBeInTheDocument();
    await expect.element(screen.getByRole("button", { name: "Cancel subscription" })).toBeVisible();
  });

  it("cancelled: shows what they had and how to restart, with nothing to manage", async () => {
    const { screen } = await renderPage(fixtures.cancelled());

    expect(headings(screen.container)).toEqual(["Your subscription", "Your subscription is cancelled", "What you had"]);
    await expect.element(screen.getByRole("button", { name: "Skip this delivery" })).not.toBeInTheDocument();
    await expect.element(screen.getByRole("button", { name: "Cancel subscription" })).not.toBeInTheDocument();
    await expect.element(screen.getByRole("button", { name: "Restart subscription" })).toBeVisible();
  });

  it("shows a confirmation of the last change in a status region", async () => {
    const { screen } = await renderPage(fixtures.cancelled(), "Your subscription is cancelled. You won't be charged again.");

    await expect.element(screen.getByRole("status")).toHaveTextContent("Your subscription is cancelled. You won't be charged again.");
  });

  it("has no WCAG 2.2 AA violations in any status", async () => {
    for (const make of [fixtures.active, fixtures.paused, fixtures.cancelled]) {
      const { screen } = await renderPage(make(), "A change was made.");
      await expectNoAxeViolations(screen.container);
      await screen.unmount();
    }
  });
});
