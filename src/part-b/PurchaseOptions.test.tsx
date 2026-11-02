import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { expectNoAxeViolations } from "../test/axe";
import { PurchaseOptions } from "./PurchaseOptions";

const handlers = () => ({ onOptionChange: vi.fn(), onFrequencyChange: vi.fn() });

describe("PurchaseOptions", () => {
  it("groups the two options under one accessible name", async () => {
    const screen = await render(<PurchaseOptions option="subscribe" frequency="30 days" {...handlers()} />);

    const group = screen.getByRole("group", { name: "Purchase option" });
    await expect.element(group.getByRole("radio", { name: /One-time purchase/ })).toBeVisible();
    await expect.element(group.getByRole("radio", { name: /Subscribe & save 15%/ })).toBeChecked();
  });

  it("reports the chosen option", async () => {
    const props = handlers();
    const screen = await render(<PurchaseOptions option="subscribe" frequency="30 days" {...props} />);

    await screen.getByRole("radio", { name: /One-time purchase/ }).click();

    expect(props.onOptionChange).toHaveBeenCalledWith("one-time");
  });

  it("offers every frequency and reports the chosen one", async () => {
    const props = handlers();
    const screen = await render(<PurchaseOptions option="subscribe" frequency="30 days" {...props} />);
    const select = screen.getByRole("combobox", { name: "Delivered every" });

    expect([...select.element().querySelectorAll("option")].map((o) => o.textContent)).toEqual(["30 days", "60 days", "90 days"]);
    await select.selectOptions("90 days");

    expect(props.onFrequencyChange).toHaveBeenCalledWith("90 days");
  });

  it("shows the frequency and perks only while subscribe is selected", async () => {
    const screen = await render(<PurchaseOptions option="one-time" frequency="30 days" {...handlers()} />);

    await expect.element(screen.getByRole("combobox", { name: "Delivered every" })).not.toBeInTheDocument();
    await expect.element(screen.getByText("Free shipping on every order")).not.toBeInTheDocument();
  });

  it("has no WCAG 2.2 AA violations with either option selected", async () => {
    const subscribed = await render(<PurchaseOptions option="subscribe" frequency="30 days" {...handlers()} />);
    await expectNoAxeViolations(subscribed.container);
    await subscribed.unmount();

    const oneTime = await render(<PurchaseOptions option="one-time" frequency="30 days" {...handlers()} />);
    await expectNoAxeViolations(oneTime.container);
  });
});
