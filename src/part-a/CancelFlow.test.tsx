import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { catalog, fixtures } from "../api/fixtures";
import type { Subscription } from "../api/types";
import { formatShortDate } from "../lib/dates";
import { expectNoAxeViolations } from "../test/axe";
import { CancelFlow } from "./CancelFlow";
import { dateAfterSkip } from "./summary";

async function renderFlow(subscription: Subscription = fixtures.active()) {
  const actions = {
    onClose: vi.fn(),
    onSkip: vi.fn(),
    onFrequencyChange: vi.fn(),
    onQuantityChange: vi.fn(),
    onSwap: vi.fn(),
    onPause: vi.fn(),
    onCancelSubscription: vi.fn(),
  };
  const screen = await render(<CancelFlow open subscription={subscription} catalog={catalog} {...actions} />);
  const chooseReason = async (label: string) => {
    await screen.getByRole("radio", { name: label }).click();
    await screen.getByRole("button", { name: "Continue" }).click();
  };
  return { screen, subscription, chooseReason, ...actions };
}

describe("CancelFlow", () => {
  it("asks for an optional reason, with focus starting on the way out that keeps the subscription", async () => {
    const { screen } = await renderFlow();

    await expect.element(screen.getByRole("dialog", { name: "Before you go" })).toBeVisible();
    await expect.element(screen.getByRole("group", { name: /This is optional/ })).toBeVisible();
    await expect.element(screen.getByRole("button", { name: "Close and keep my subscription" })).toHaveFocus();
  });

  it("can cancel straight away, without giving a reason", async () => {
    const { screen, onCancelSubscription } = await renderFlow();

    await screen.getByRole("button", { name: "Cancel subscription" }).click();

    expect(onCancelSubscription).toHaveBeenCalledWith(null);
  });

  it("needs a reason before Continue does anything, and looks unavailable until then", async () => {
    const { screen } = await renderFlow();
    const next = screen.getByRole("button", { name: "Continue" });
    const background = () => getComputedStyle(next.element()).backgroundColor;
    const brand = "rgb(23, 64, 47)";

    await expect.element(next).toHaveAttribute("aria-disabled", "true");
    expect(background()).not.toBe(brand);
    // force: Playwright treats aria-disabled as disabled and would wait; a real user can still press it.
    await next.click({ force: true });
    await expect.element(screen.getByRole("dialog", { name: "Before you go" })).toBeVisible();

    await screen.getByRole("radio", { name: "It costs too much" }).click();
    await expect.element(next).not.toHaveAttribute("aria-disabled");
    expect(background()).toBe(brand);
  });

  it("too much product: offers skipping the next delivery first, then delivering less often", async () => {
    const { screen, subscription, chooseReason, onSkip, onFrequencyChange } = await renderFlow();
    const next = subscription.nextChargeAt ?? "";

    await chooseReason("I have too much product left");

    await expect.element(screen.getByRole("dialog", { name: "Have too much on hand?" })).toBeVisible();
    const options = screen.getByRole("button", { name: /^(Skip|Deliver every)/ });
    await expect.element(options.nth(0)).toHaveAccessibleName(`Skip the ${formatShortDate(next)} delivery Your next delivery would be ${formatShortDate(dateAfterSkip(next, 30))}`);
    await options.nth(0).click();
    expect(onSkip).toHaveBeenCalledOnce();
    await screen.getByRole("button", { name: /^Deliver every 90 days/ }).click();
    expect(onFrequencyChange).toHaveBeenCalledWith(90);
  });

  it("costs too much: offers fewer units with the new price, or delivering half as often", async () => {
    const { screen, chooseReason, onQuantityChange, onFrequencyChange } = await renderFlow();

    await chooseReason("It costs too much");

    // 1 Vitamin D + 1 Multivitamin = $74.90, which is $63.67 after the 15% saving.
    await screen.getByRole("button", { name: "Get 1 Multivitamin instead of 2 $63.67 per delivery" }).click();
    expect(onQuantityChange).toHaveBeenCalledWith("NW-MULTI-30", 1);
    await screen.getByRole("button", { name: /^Deliver every 60 days/ }).click();
    expect(onFrequencyChange).toHaveBeenCalledWith(60);
  });

  it("different product: lets the customer choose which product to swap, in one tap", async () => {
    const { screen, chooseReason, onSwap } = await renderFlow();

    await chooseReason("I'm trying a different product");

    await expect.element(screen.getByRole("dialog", { name: "Try something else of ours?" })).toBeVisible();
    await expect.element(screen.getByRole("button", { name: /^Swap Vitamin D for Magnesium/ })).toBeVisible();
    await screen.getByRole("button", { name: /^Swap Multivitamin for Magnesium/ }).click();
    expect(onSwap).toHaveBeenCalledWith("NW-MULTI-30", expect.objectContaining({ sku: "NW-MAG-90" }));
  });

  it("different product: never offers the bundle, which already contains the products being replaced", async () => {
    const { screen, chooseReason } = await renderFlow();

    await chooseReason("I'm trying a different product");

    await expect.element(screen.getByRole("button", { name: /Daily Essentials/ })).not.toBeInTheDocument();
  });

  it("different product with nothing left to swap to: offers a pause instead, titled to match", async () => {
    const everything = { ...fixtures.active(), items: catalog.map((product) => ({ ...product, quantity: 1 })) };
    const { screen, chooseReason } = await renderFlow(everything);

    await chooseReason("I'm trying a different product");

    await expect.element(screen.getByRole("dialog", { name: "Want to take a break instead?" })).toBeVisible();
    await expect.element(screen.getByRole("button", { name: "Pause for 1 month" })).toBeVisible();
  });

  it.each(["I didn't see results", "Something else"])("%s: offers a pause", async (label) => {
    const { screen, chooseReason, onPause } = await renderFlow();

    await chooseReason(label);

    await expect.element(screen.getByRole("dialog", { name: "Want to take a break instead?" })).toBeVisible();
    await screen.getByRole("button", { name: "Pause for 1 month" }).click();
    expect(onPause).toHaveBeenCalledWith(1);
  });

  it("can still cancel from an offer, passing the reason, or go back to change it", async () => {
    const { screen, chooseReason, onCancelSubscription } = await renderFlow();

    await chooseReason("It costs too much");
    await screen.getByRole("button", { name: "Back" }).click();
    await expect.element(screen.getByRole("dialog", { name: "Before you go" })).toBeVisible();
    await screen.getByRole("button", { name: "Continue" }).click();
    await screen.getByRole("button", { name: "Cancel subscription" }).click();

    expect(onCancelSubscription).toHaveBeenCalledWith("too-expensive");
  });

  it("closing keeps the subscription and starts over next time", async () => {
    const { screen, chooseReason, onClose } = await renderFlow();

    await chooseReason("It costs too much");
    await screen.getByRole("button", { name: "Close and keep my subscription" }).click();

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("has no WCAG 2.2 AA violations on the reason step or any offer", async () => {
    for (const label of [null, "I have too much product left", "It costs too much", "I'm trying a different product", "I didn't see results"]) {
      const { screen, chooseReason } = await renderFlow();
      if (label) await chooseReason(label);
      await expectNoAxeViolations(screen.container);
      await screen.unmount();
    }
  });
});
