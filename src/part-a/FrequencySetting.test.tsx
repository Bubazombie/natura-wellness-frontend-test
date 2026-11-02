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

describe("FrequencySetting confirmation", () => {
  it("confirms a change right under the select, in a status region that describes it", async () => {
    const screen = await render(<FrequencySetting intervalDays={60} onChange={vi.fn()} confirmation="From now on, every 60 days." />);
    const select = screen.getByRole("combobox", { name: "Delivery frequency" });

    await expect.element(screen.getByRole("status")).toHaveTextContent("From now on, every 60 days.");
    await expect.element(select).toHaveAccessibleDescription("From now on, every 60 days.");
  });

  it("keeps the status region rendered, with no space taken, when there is nothing to confirm", async () => {
    const screen = await render(<FrequencySetting intervalDays={30} onChange={vi.fn()} />);
    const region = screen.getByRole("status");

    await expect.element(region).toBeInTheDocument();
    expect(region.element().getBoundingClientRect().height).toBe(0);
    expect(getComputedStyle(region.element()).display).not.toBe("none");
  });
});
