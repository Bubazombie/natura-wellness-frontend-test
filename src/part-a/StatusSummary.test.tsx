import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { fixtures } from "../api/fixtures";
import { formatFullDate, formatShortDate, formatWeekdayDate } from "../lib/dates";
import { expectNoAxeViolations } from "../test/axe";
import { StatusSummary } from "./StatusSummary";

const handlers = () => ({ onSkip: vi.fn(), onResume: vi.fn(), onRestart: vi.fn() });

describe("StatusSummary", () => {
  it("active: says when the next delivery is, how much and for how many items, and offers to skip it", async () => {
    const subscription = fixtures.active();
    const next = subscription.nextChargeAt ?? "";
    const actions = handlers();
    const screen = await render(<StatusSummary subscription={subscription} {...actions} />);

    await expect.element(screen.getByRole("region", { name: "Next delivery" })).toBeVisible();
    await expect.element(screen.getByText(formatWeekdayDate(next))).toBeVisible();
    await expect.element(screen.getByText(`You'll be charged $101.87 on ${formatShortDate(next)} for 3 items.`)).toBeVisible();
    await screen.getByRole("button", { name: "Skip this delivery" }).click();
    expect(actions.onSkip).toHaveBeenCalledOnce();
  });

  it("paused: says when deliveries resume and that there is no charge, and offers to resume", async () => {
    const subscription = fixtures.paused();
    const actions = handlers();
    const screen = await render(<StatusSummary subscription={subscription} {...actions} />);

    await expect.element(screen.getByRole("heading", { name: "Your deliveries are paused" })).toBeVisible();
    await expect.element(screen.getByText(`They resume on ${formatWeekdayDate(subscription.pausedUntil ?? "")}.`, { exact: false })).toBeVisible();
    await expect.element(screen.getByRole("button", { name: "Skip this delivery" })).not.toBeInTheDocument();
    await screen.getByRole("button", { name: "Resume now" }).click();
    expect(actions.onResume).toHaveBeenCalledOnce();
  });

  it("cancelled: says when it was cancelled and that there are no more charges, and offers to restart", async () => {
    const subscription = fixtures.cancelled();
    const actions = handlers();
    const screen = await render(<StatusSummary subscription={subscription} {...actions} />);

    await expect.element(screen.getByRole("heading", { name: "Your subscription is cancelled" })).toBeVisible();
    await expect.element(screen.getByText(`You cancelled on ${formatFullDate(subscription.cancelledAt ?? "")}.`, { exact: false })).toBeVisible();
    await expect.element(screen.getByRole("button", { name: "Skip this delivery" })).not.toBeInTheDocument();
    await screen.getByRole("button", { name: "Restart subscription" }).click();
    expect(actions.onRestart).toHaveBeenCalledOnce();
  });

  it("cancelled just now: confirms it happened today, so no separate notice is needed", async () => {
    const subscription = { ...fixtures.cancelled(), cancelledAt: new Date().toISOString() };
    const screen = await render(<StatusSummary subscription={subscription} {...handlers()} />);

    await expect.element(screen.getByText("You cancelled today. You won't be charged again.")).toBeVisible();
  });

  it("has no WCAG 2.2 AA violations in any status", async () => {
    for (const make of [fixtures.active, fixtures.paused, fixtures.cancelled]) {
      const screen = await render(<StatusSummary subscription={make()} {...handlers()} />);
      await expectNoAxeViolations(screen.container);
      await screen.unmount();
    }
  });
});

describe("StatusSummary copy", () => {
  const noop = { onSkip: () => undefined, onResume: () => undefined, onRestart: () => undefined };

  it("says item, not items, for a single item", async () => {
    const subscription = { ...fixtures.active(), items: [{ sku: "X", name: "X", quantity: 1, unitPriceCents: 1000, imageUrl: null }] };
    const screen = await render(<StatusSummary subscription={subscription} {...noop} />);

    await expect.element(screen.getByText(/for 1 item\.$/)).toBeVisible();
  });

  it("paused with no resume date: doesn't refer to a date it hasn't given", async () => {
    const screen = await render(<StatusSummary subscription={{ ...fixtures.paused(), pausedUntil: null }} {...noop} />);

    await expect.element(screen.getByText("You won't be charged while they are paused.")).toBeVisible();
    await expect.element(screen.getByText(/until then/)).not.toBeInTheDocument();
  });
});
