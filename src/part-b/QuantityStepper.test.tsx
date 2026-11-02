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

  it("marks decrease unavailable at the minimum and increase at the maximum", async () => {
    const atMin = await render(<QuantityStepper value={1} min={1} max={10} onChange={vi.fn()} />);
    await expect.element(atMin.getByRole("button", { name: "Decrease quantity" })).toHaveAttribute("aria-disabled", "true");
    await expect.element(atMin.getByRole("button", { name: "Increase quantity" })).toHaveAttribute("aria-disabled", "false");
    await atMin.unmount();

    const atMax = await render(<QuantityStepper value={10} min={1} max={10} onChange={vi.fn()} />);
    await expect.element(atMax.getByRole("button", { name: "Increase quantity" })).toHaveAttribute("aria-disabled", "true");
    await expect.element(atMax.getByRole("button", { name: "Decrease quantity" })).toHaveAttribute("aria-disabled", "false");
  });

  it("does nothing when an unavailable button is pressed, but keeps it focusable", async () => {
    const onChange = vi.fn();
    const screen = await render(<QuantityStepper value={1} min={1} max={10} onChange={onChange} />);
    const decrease = screen.getByRole("button", { name: "Decrease quantity" });

    // force: Playwright treats aria-disabled as disabled and would wait; a real user can still click it.
    await decrease.click({ force: true });
    decrease.element().focus();

    expect(onChange).not.toHaveBeenCalled();
    await expect.element(decrease).toHaveFocus();
  });

  it("looks the same at the limit as elsewhere, as in the reference", async () => {
    const screen = await render(<QuantityStepper value={1} min={1} max={10} onChange={vi.fn()} />);
    const style = (name: string) => getComputedStyle(screen.getByRole("button", { name }).element());

    expect(style("Decrease quantity").color).toBe(style("Increase quantity").color);
    expect(style("Decrease quantity").opacity).toBe("1");
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
