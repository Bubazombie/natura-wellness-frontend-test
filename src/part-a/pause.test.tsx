// PauseOptions, PauseDialog and OfferOption: the choices offered instead of cancelling.
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { expectNoAxeViolations } from "../test/axe";
import { OfferOption } from "./OfferOption";
import { PauseDialog } from "./PauseDialog";
import { PauseOptions } from "./PauseOptions";

describe("PauseOptions", () => {
  it("offers 1, 2 or 3 months, each named for what it does", async () => {
    const onPause = vi.fn();
    const screen = await render(<PauseOptions onPause={onPause} />);

    await screen.getByRole("button", { name: "Pause for 1 month" }).click();
    await screen.getByRole("button", { name: "Pause for 3 months" }).click();

    expect(onPause.mock.calls).toEqual([[1], [3]]);
    await expect.element(screen.getByRole("button", { name: "Pause for 2 months" })).toHaveTextContent("2 months");
  });
});

describe("PauseOptions with a subset", () => {
  it("offers only the lengths it is given", async () => {
    const screen = await render(<PauseOptions options={[2, 3]} onPause={vi.fn()} />);

    await expect.element(screen.getByRole("button", { name: "Pause for 1 month" })).not.toBeInTheDocument();
    expect(screen.getByRole("button").elements()).toHaveLength(2);
  });
});

describe("PauseDialog", () => {
  it("explains the pause, starts on the safe choice and reports the chosen length", async () => {
    const actions = { onPause: vi.fn(), onClose: vi.fn() };
    const screen = await render(<PauseDialog open {...actions} />);

    await expect.element(screen.getByRole("dialog", { name: "Pause your deliveries" })).toBeVisible();
    await expect.element(screen.getByRole("button", { name: "Not now" })).toHaveFocus();
    await screen.getByRole("button", { name: "Pause for 2 months" }).click();
    expect(actions.onPause).toHaveBeenCalledWith(2);
    await screen.getByRole("button", { name: "Not now" }).click();
    expect(actions.onClose).toHaveBeenCalledOnce();
  });

  it("has no WCAG 2.2 AA violations", async () => {
    const screen = await render(<PauseDialog open onPause={vi.fn()} onClose={vi.fn()} />);

    await expectNoAxeViolations(screen.container);
  });
});

describe("OfferOption", () => {
  it("is one button named by its action and detail", async () => {
    const onChoose = vi.fn();
    const screen = await render(<OfferOption label="Deliver every 60 days" detail="Same items and price, less often" onChoose={onChoose} />);

    await screen.getByRole("button", { name: "Deliver every 60 days Same items and price, less often" }).click();

    expect(onChoose).toHaveBeenCalledOnce();
  });

  it("is at least 44px tall and has no WCAG 2.2 AA violations, primary or not", async () => {
    const screen = await render(
      <>
        <OfferOption primary label="Skip" detail="Next one Dec 8" onChoose={vi.fn()} />
        <OfferOption label="Less often" detail="Every 60 days" onChoose={vi.fn()} />
      </>,
    );

    for (const button of screen.getByRole("button").elements()) expect(button.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    await expectNoAxeViolations(screen.container);
  });
});
