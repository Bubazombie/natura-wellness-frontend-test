import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { expectNoAxeViolations } from "../test/axe";
import { OptionCard } from "./OptionCard";

const props = { name: "option", value: "a", label: "Option A", price: "$1.00", details: <p>Extra details</p> };

describe("OptionCard", () => {
  it("is a radio named by its label and price", async () => {
    const screen = await render(<OptionCard {...props} checked={false} onSelect={vi.fn()} />);

    await expect.element(screen.getByRole("radio", { name: "Option A $1.00" })).not.toBeChecked();
  });

  it("reports its value when chosen, including by clicking the label text", async () => {
    const onSelect = vi.fn();
    const screen = await render(<OptionCard {...props} checked={false} onSelect={onSelect} />);

    await screen.getByText("Option A").click();

    expect(onSelect).toHaveBeenCalledWith("a");
  });

  it("shows its details only while selected", async () => {
    const unchecked = await render(<OptionCard {...props} checked={false} onSelect={vi.fn()} />);
    await expect.element(unchecked.getByText("Extra details")).not.toBeInTheDocument();
    await unchecked.unmount();

    const checked = await render(<OptionCard {...props} checked onSelect={vi.fn()} />);
    await expect.element(checked.getByText("Extra details")).toBeVisible();
  });

  it("keeps its content in place when selected, so choosing an option causes no layout shift", async () => {
    const unchecked = await render(<OptionCard {...props} details={undefined} checked={false} onSelect={vi.fn()} />);
    const before = unchecked.getByRole("radio").element().getBoundingClientRect();
    await unchecked.unmount();

    const checked = await render(<OptionCard {...props} details={undefined} checked onSelect={vi.fn()} />);
    const after = checked.getByRole("radio").element().getBoundingClientRect();

    expect({ x: after.x, y: after.y }).toEqual({ x: before.x, y: before.y });
  });

  it("has no WCAG 2.2 AA violations when checked or unchecked", async () => {
    const unchecked = await render(<OptionCard {...props} checked={false} onSelect={vi.fn()} />);
    await expectNoAxeViolations(unchecked.container);
    await unchecked.unmount();

    const checked = await render(<OptionCard {...props} checked onSelect={vi.fn()} />);
    await expectNoAxeViolations(checked.container);
  });
});
