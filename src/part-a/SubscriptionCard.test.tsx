// The static preview entry: with no ?fixture in the test URL it shows the active fixture.
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { SubscriptionCard } from "./SubscriptionCard";

describe("SubscriptionCard (static preview)", () => {
  it("shows the active subscription", async () => {
    const screen = await render(<SubscriptionCard />);

    await expect.element(screen.getByRole("heading", { level: 1, name: "Your subscription" })).toBeVisible();
    await expect.element(screen.getByRole("region", { name: "Next delivery" })).toBeVisible();
  });

  it.each([
    ["Skip this delivery", /^Skip your .+ delivery\?$/],
    ["Pause deliveries", "Pause your deliveries"],
    ["Cancel subscription", "Before you go"],
  ])("opens a dialog from %s and closes it with Escape, back on the same button", async (button, dialogName) => {
    const screen = await render(<SubscriptionCard />);
    const trigger = screen.getByRole("button", { name: button });

    await trigger.click();
    await expect.element(screen.getByRole("dialog", { name: dialogName })).toBeVisible();
    await userEvent.keyboard("{Escape}");

    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
    await expect.element(trigger).toHaveFocus();
  });
});
