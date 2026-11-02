import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { expectNoAxeViolations } from "../test/axe";
import { QuantityStepper } from "./QuantityStepper";

describe("QuantityStepper", () => {
  it("shows the value in a labelled field", async () => {
    const screen = await render(<QuantityStepper value={3} min={1} max={10} onChange={vi.fn()} />);

    await expect.element(screen.getByRole("textbox", { name: "Quantity" })).toHaveValue("3");
  });

  it("asks for one less and one more", async () => {
    const onChange = vi.fn();
    const screen = await render(<QuantityStepper value={3} min={1} max={10} onChange={onChange} />);

    await screen.getByRole("button", { name: "Decrease quantity" }).click();
    await screen.getByRole("button", { name: "Increase quantity" }).click();

    expect(onChange.mock.calls).toEqual([[2], [4]]);
  });

  it("disables decrease at the minimum and increase at the maximum", async () => {
    const atMin = await render(<QuantityStepper value={1} min={1} max={10} onChange={vi.fn()} />);
    await expect.element(atMin.getByRole("button", { name: "Decrease quantity" })).toBeDisabled();
    await expect.element(atMin.getByRole("button", { name: "Increase quantity" })).toBeEnabled();
    await atMin.unmount();

    const atMax = await render(<QuantityStepper value={10} min={1} max={10} onChange={vi.fn()} />);
    await expect.element(atMax.getByRole("button", { name: "Increase quantity" })).toBeDisabled();
    await expect.element(atMax.getByRole("button", { name: "Decrease quantity" })).toBeEnabled();
  });

  it("has buttons of at least 44x44px", async () => {
    const screen = await render(<QuantityStepper value={3} min={1} max={10} onChange={vi.fn()} />);

    for (const name of ["Decrease quantity", "Increase quantity"]) {
      const box = screen.getByRole("button", { name }).element().getBoundingClientRect();
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });

  it("has no WCAG 2.2 AA violations", async () => {
    const screen = await render(<QuantityStepper value={1} min={1} max={10} onChange={vi.fn()} />);

    await expectNoAxeViolations(screen.container);
  });
});
