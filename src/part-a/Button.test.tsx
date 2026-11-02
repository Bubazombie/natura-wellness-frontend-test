import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { expectNoAxeViolations } from "../test/axe";
import { Button } from "./Button";

describe("Button", () => {
  it("is a button that calls onClick", async () => {
    const onClick = vi.fn();
    const screen = await render(<Button onClick={onClick}>Save</Button>);

    await screen.getByRole("button", { name: "Save" }).click();

    expect(onClick).toHaveBeenCalledOnce();
    await expect.element(screen.getByRole("button", { name: "Save" })).toHaveAttribute("type", "button");
  });

  it.each([
    ["busy", { busy: true }],
    ["unavailable", { unavailable: true }],
  ])("when %s, stays focusable, is announced as unavailable and ignores presses", async (_, state) => {
    const onClick = vi.fn();
    const screen = await render(
      <Button onClick={onClick} {...state}>
        Save
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Save" });

    // force: Playwright treats aria-disabled as disabled and would wait; a real user can still press it.
    await button.click({ force: true });
    button.element().focus();

    expect(onClick).not.toHaveBeenCalled();
    await expect.element(button).toHaveAttribute("aria-disabled", "true");
    await expect.element(button).toHaveFocus();
  });

  it("looks unavailable when unavailable, but keeps its normal look while busy", async () => {
    const screen = await render(
      <>
        <Button variant="primary">Normal</Button>
        <Button variant="primary" unavailable>
          Unavailable
        </Button>
        <Button variant="primary" busy>
          Busy
        </Button>
      </>,
    );
    const background = (name: string) => getComputedStyle(screen.getByRole("button", { name }).element()).backgroundColor;

    expect(background("Unavailable")).not.toBe(background("Normal"));
    expect(background("Busy")).toBe(background("Normal"));
  });

  it("is at least 44 by 44px in every variant, even with a one-letter label", async () => {
    const screen = await render(
      <>
        <Button variant="primary">A</Button>
        <Button variant="secondary">B</Button>
        <Button variant="quiet">C</Button>
      </>,
    );

    for (const button of screen.getByRole("button").elements()) {
      expect(button.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
      expect(button.getBoundingClientRect().width).toBeGreaterThanOrEqual(44);
    }
  });

  it("has no horizontal padding in the quiet variant, so it lines up with text", async () => {
    const screen = await render(<Button variant="quiet">Cancel</Button>);

    expect(getComputedStyle(screen.getByRole("button").element()).paddingLeft).toBe("0px");
  });

  it("has no WCAG 2.2 AA violations in any variant", async () => {
    const screen = await render(
      <>
        <Button variant="primary">A</Button>
        <Button variant="secondary">B</Button>
        <Button variant="quiet">C</Button>
      </>,
    );

    await expectNoAxeViolations(screen.container);
  });
});
