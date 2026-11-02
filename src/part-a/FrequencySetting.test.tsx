import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { expectNoAxeViolations } from "../test/axe";
import { FrequencySetting } from "./FrequencySetting";

describe("FrequencySetting", () => {
  it("is a labelled select showing the current frequency", async () => {
    const screen = await render(<FrequencySetting intervalDays={30} onChange={vi.fn()} />);
    const select = screen.getByRole("combobox", { name: "Delivery frequency" });

    await expect.element(select).toHaveDisplayValue("Every 30 days");
    expect([...select.element().querySelectorAll("option")].map((o) => o.textContent)).toEqual(["Every 30 days", "Every 60 days", "Every 90 days"]);
  });

  it("reports the new frequency in days", async () => {
    const onChange = vi.fn();
    const screen = await render(<FrequencySetting intervalDays={30} onChange={onChange} />);

    await screen.getByRole("combobox", { name: "Delivery frequency" }).selectOptions("Every 60 days");

    expect(onChange).toHaveBeenCalledWith(60);
  });

  it("is at least 44px tall", async () => {
    const screen = await render(<FrequencySetting intervalDays={30} onChange={vi.fn()} />);

    expect(screen.getByRole("combobox").element().getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
  });

  it("has no WCAG 2.2 AA violations", async () => {
    const screen = await render(<FrequencySetting intervalDays={30} onChange={vi.fn()} />);

    await expectNoAxeViolations(screen.container);
  });
});
