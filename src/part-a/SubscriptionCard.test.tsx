// The whole Part A page with the API mocked, so every response and its timing is controlled.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { fixtures } from "../api/fixtures";
import { getSubscription, skipNextShipment } from "../api/mockApi";
import { ApiError, type Subscription } from "../api/types";
import { formatShortDate } from "../lib/dates";
import { expectNoAxeViolations } from "../test/axe";
import { SubscriptionCard } from "./SubscriptionCard";
import { dateAfterSkip } from "./summary";

vi.mock("../api/mockApi", () => ({ getSubscription: vi.fn(), skipNextShipment: vi.fn() }));
const load = vi.mocked(getSubscription);
const skip = vi.mocked(skipNextShipment);

const NEXT = "2026-11-08T15:00:00.000Z";
const activeSubscription = (): Subscription => ({ ...fixtures.active(), nextChargeAt: NEXT });
const skippedOnServer = (s: Subscription): Subscription => ({ ...s, nextChargeAt: dateAfterSkip(s.nextChargeAt ?? NEXT, 30), updatedAt: "2026-11-02T18:00:00.000Z" });
const conflict = () => Promise.reject(new ApiError(409, "Subscription was modified since it was loaded"));

beforeEach(() => {
  load.mockReset();
  skip.mockReset();
});

async function renderLoaded(subscription: Subscription = activeSubscription()) {
  load.mockResolvedValue(subscription);
  const screen = await render(<SubscriptionCard />);
  await expect.element(screen.getByRole("heading", { level: 2 }).first()).toBeVisible();
  return screen;
}

const openSkip = async (screen: Awaited<ReturnType<typeof renderLoaded>>) => {
  await screen.getByRole("button", { name: "Skip this delivery" }).click();
  return screen.getByRole("dialog");
};

describe("SubscriptionCard: loading", () => {
  it("shows the loading placeholder, then the subscription", async () => {
    let resolve: (s: Subscription) => void = () => undefined;
    load.mockReturnValue(new Promise((r) => (resolve = r)));
    const screen = await render(<SubscriptionCard />);

    await expect.element(screen.getByRole("status").filter({ hasText: "Loading your subscription" })).toBeInTheDocument();
    resolve(activeSubscription());

    await expect.element(screen.getByRole("region", { name: "Next delivery" })).toBeVisible();
  });

  it("server error: retries once, then says so and offers to try again, which can succeed", async () => {
    load.mockRejectedValueOnce(new ApiError(500, "Internal server error")).mockRejectedValueOnce(new ApiError(500, "Internal server error"));
    const screen = await render(<SubscriptionCard />);

    await expect.element(screen.getByRole("heading", { name: "We couldn't load your subscription" })).toBeVisible();
    expect(load).toHaveBeenCalledTimes(2);

    load.mockResolvedValueOnce(activeSubscription());
    await screen.getByRole("button", { name: "Try again" }).click();
    await expect.element(screen.getByRole("region", { name: "Next delivery" })).toBeVisible();
  });

  it("not found: says so without retrying, since asking again won't change a 404", async () => {
    load.mockRejectedValue(new ApiError(404, "Subscription not found"));
    const screen = await render(<SubscriptionCard />);

    await expect.element(screen.getByRole("heading", { name: "We couldn't find a subscription on your account" })).toBeVisible();
    expect(load).toHaveBeenCalledOnce();
  });
});

describe("SubscriptionCard: skipping", () => {
  it("skips through the API, confirms with the new date, and returns focus to the Skip button", async () => {
    const screen = await renderLoaded();
    skip.mockImplementation(({ expectedUpdatedAt }) => {
      expect(expectedUpdatedAt).toBe(activeSubscription().updatedAt);
      return Promise.resolve(skippedOnServer(activeSubscription()));
    });

    await openSkip(screen);
    await screen.getByRole("button", { name: "Skip Nov 8 delivery" }).click();

    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
    await expect.element(screen.getByText("Done. Your Nov 8 delivery is skipped. Your next delivery is Dec 8.")).toBeVisible();
    await expect.element(screen.getByText("Tuesday, December 8")).toBeVisible();
    await expect.element(screen.getByRole("button", { name: "Skip this delivery" })).toHaveFocus();
  });

  it("while the skip is in flight, can't be closed or confirmed twice", async () => {
    const screen = await renderLoaded();
    let resolve: (s: Subscription) => void = () => undefined;
    skip.mockReturnValue(new Promise((r) => (resolve = r)));

    await openSkip(screen);
    await screen.getByRole("button", { name: "Skip Nov 8 delivery" }).click();
    await expect.element(screen.getByRole("button", { name: "Skipping..." })).toHaveAttribute("aria-disabled", "true");
    await screen.getByRole("button", { name: "Keep it" }).click({ force: true });
    await screen.getByRole("button", { name: "Skipping..." }).click({ force: true });

    expect(skip).toHaveBeenCalledOnce();
    await expect.element(screen.getByRole("dialog")).toBeVisible();
    resolve(skippedOnServer(activeSubscription()));
    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
  });

  it("on a 409, loads the latest details and asks again; confirming again then succeeds", async () => {
    const screen = await renderLoaded();
    const changedElsewhere = { ...activeSubscription(), updatedAt: "2026-11-02T17:00:00.000Z" };
    skip.mockImplementationOnce(conflict).mockResolvedValueOnce(skippedOnServer(changedElsewhere));
    load.mockResolvedValue(changedElsewhere);

    await openSkip(screen);
    await screen.getByRole("button", { name: "Skip Nov 8 delivery" }).click();

    await expect.element(screen.getByRole("alert")).toBeVisible();
    expect(screen.getByRole("alert").element().textContent).toContain("changed since you opened this page, so we didn't skip anything");
    await expect.element(screen.getByRole("link", { name: "help@natura-wellness.example" })).not.toBeInTheDocument();
    await screen.getByRole("button", { name: "Skip Nov 8 delivery" }).click();

    // The second attempt is based on the latest version, not the one the page first loaded.
    expect(skip.mock.calls[1]?.[0].expectedUpdatedAt).toBe(changedElsewhere.updatedAt);
    await expect.element(screen.getByText("Done. Your Nov 8 delivery is skipped. Your next delivery is Dec 8.")).toBeVisible();
  });

  it("after repeated conflicts, also offers support", async () => {
    const screen = await renderLoaded();
    skip.mockImplementation(conflict);

    await openSkip(screen);
    await screen.getByRole("button", { name: "Skip Nov 8 delivery" }).click();
    await expect.element(screen.getByRole("alert")).toBeVisible();
    await screen.getByRole("button", { name: "Skip Nov 8 delivery" }).click();

    await expect.element(screen.getByRole("link", { name: "help@natura-wellness.example" })).toBeVisible();
  });

  it("on any other error, says nothing changed and offers to try again", async () => {
    const screen = await renderLoaded();
    skip.mockRejectedValueOnce(new ApiError(500, "Internal server error")).mockResolvedValueOnce(skippedOnServer(activeSubscription()));

    await openSkip(screen);
    await screen.getByRole("button", { name: "Skip Nov 8 delivery" }).click();
    await expect.element(screen.getByRole("alert")).toHaveTextContent("We couldn't skip your delivery. Nothing changed. Please try again.");
    await screen.getByRole("button", { name: "Try again" }).click();

    await expect.element(screen.getByText(/Your Nov 8 delivery is skipped/)).toBeVisible();
  });
});

describe("SubscriptionCard: simulated changes", () => {
  it("a frequency change keeps the next date, and survives a successful skip, which then uses it", async () => {
    const screen = await renderLoaded();
    skip.mockResolvedValue(skippedOnServer(activeSubscription()));

    await screen.getByRole("combobox", { name: "Delivery frequency" }).selectOptions("Every 60 days");
    await expect.element(screen.getByText("Your Nov 8 delivery is unchanged. After that, you'll get a delivery every 60 days.")).toBeVisible();
    await openSkip(screen);
    await expect.element(screen.getByText(`Your next delivery will be ${formatShortDate(dateAfterSkip(NEXT, 60))}.`, { exact: false })).toBeVisible();
    await screen.getByRole("button", { name: "Skip Nov 8 delivery" }).click();

    // The mock moved the date by its own 30 days; the page shows the 60 the customer chose.
    await expect.element(screen.getByText("Thursday, January 7")).toBeVisible();
    await expect.element(screen.getByRole("combobox", { name: "Delivery frequency" })).toHaveDisplayValue("Every 60 days");
  });

  it("local changes survive the refetch after a conflict", async () => {
    const screen = await renderLoaded();
    skip.mockImplementation(conflict);
    load.mockResolvedValue({ ...activeSubscription(), updatedAt: "2026-11-02T17:00:00.000Z" });

    await screen.getByRole("combobox", { name: "Delivery frequency" }).selectOptions("Every 90 days");
    await openSkip(screen);
    await screen.getByRole("button", { name: "Skip Nov 8 delivery" }).click();
    await expect.element(screen.getByRole("alert")).toBeVisible();

    expect(load).toHaveBeenCalledTimes(2);
    await expect.element(screen.getByRole("combobox", { name: "Delivery frequency", includeHidden: true })).toHaveDisplayValue("Every 90 days");
  });

  it("pausing shows the paused card, moves focus to it and announces it", async () => {
    const screen = await renderLoaded();

    await screen.getByRole("button", { name: "Pause deliveries" }).click();
    await screen.getByRole("button", { name: "Pause for 1 month" }).click();

    const heading = screen.getByRole("heading", { name: "Your deliveries are paused" });
    await expect.element(heading).toHaveFocus();
    await expect.element(screen.getByRole("status").filter({ hasText: /^Your deliveries are paused\. They resume on/ })).toBeInTheDocument();
    await expect.element(screen.getByRole("button", { name: "Skip this delivery" })).not.toBeInTheDocument();
  });

  it("cancelling confirms on the card itself, says it happened today, and moves focus there", async () => {
    const screen = await renderLoaded();

    await screen.getByRole("button", { name: "Cancel subscription" }).click();
    await screen.getByRole("dialog").getByRole("button", { name: "Cancel subscription" }).click();

    await expect.element(screen.getByRole("heading", { name: "Your subscription is cancelled" })).toHaveFocus();
    await expect.element(screen.getByText("You cancelled today. You won't be charged again.")).toBeVisible();
    await expect.element(screen.getByRole("button", { name: "Restart subscription" })).toBeVisible();
  });

  it("the cancel flow's skip offer skips straight away, without asking a second time", async () => {
    const screen = await renderLoaded();
    skip.mockResolvedValue(skippedOnServer(activeSubscription()));

    await screen.getByRole("button", { name: "Cancel subscription" }).click();
    await screen.getByRole("radio", { name: "I have too much product left" }).click();
    await screen.getByRole("button", { name: "Continue" }).click();
    await screen.getByRole("button", { name: /^Skip the Nov 8 delivery/ }).click();

    await expect.element(screen.getByText("Done. Your Nov 8 delivery is skipped. Your next delivery is Dec 8.")).toBeVisible();
    expect(skip).toHaveBeenCalledOnce();
  });

  it("a subscription resumed here is still paused on the server, so its skip is simulated, not sent", async () => {
    const screen = await renderLoaded(fixtures.paused());

    await screen.getByRole("button", { name: "Resume now" }).click();
    await openSkip(screen);
    await screen.getByRole("dialog").getByRole("button", { name: /^Skip .+ delivery$/ }).click();

    await expect.element(screen.getByText(/delivery is skipped/)).toBeVisible();
    expect(skip).not.toHaveBeenCalled();
  });

  it("has no WCAG 2.2 AA violations once loaded", async () => {
    const screen = await renderLoaded();

    await expectNoAxeViolations(screen.container);
  });
});
