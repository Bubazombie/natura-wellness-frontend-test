import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectNoAxeViolations } from "../test/axe";
import { QuantityStepper } from "./QuantityStepper";
import { useQuantityField } from "./useQuantityField";

const TOO_MANY = "You can order up to 10 at a time.";
const OUT_OF_RANGE = "Enter a quantity from 1 to 10.";

// The stepper with the real hook and message region, wired the way BuyBox wires them.
function Harness() {
  const field = useQuantityField({ min: 1, max: 10 });
  return (
    <>
      <QuantityStepper field={field} describedBy="message" />
      <output data-testid="value">{field.value}</output>
      <p id="message" aria-live="polite">
        {field.message}
      </p>
    </>
  );
}

async function setup() {
  const screen = await render(<Harness />);
  const input = screen.getByRole("spinbutton", { name: "Quantity" });
  return {
    screen,
    input,
    decrease: screen.getByRole("button", { name: "Decrease quantity" }),
    increase: screen.getByRole("button", { name: "Increase quantity" }),
    value: () => screen.getByTestId("value").element().textContent,
    message: () => screen.container.querySelector("#message")?.textContent ?? "",
    typeAndCommit: async (text: string, commit: "blur" | "enter") => {
      await input.fill(text);
      if (commit === "enter") await userEvent.keyboard("{Enter}");
      else await screen.getByTestId("value").click();
    },
  };
}

describe("QuantityStepper", () => {
  it("is a spin button with its value and range, described by the message region", async () => {
    const { input } = await setup();

    await expect.element(input).toHaveValue("1");
    await expect.element(input).toHaveAttribute("aria-valuenow", "1");
    await expect.element(input).toHaveAttribute("aria-valuemin", "1");
    await expect.element(input).toHaveAttribute("aria-valuemax", "10");
    await expect.element(input).toHaveAttribute("aria-describedby", "message");
    await expect.element(input).toHaveAttribute("inputmode", "numeric");
  });

  it("steps with the buttons", async () => {
    const { increase, decrease, value } = await setup();

    await increase.click();
    await increase.click();
    await decrease.click();

    expect(value()).toBe("2");
  });

  it("steps with Up and Down, and jumps to the limits with Home and End", async () => {
    const { input, value } = await setup();
    await input.click();

    await userEvent.keyboard("{ArrowUp}{ArrowUp}");
    expect(value()).toBe("3");
    await userEvent.keyboard("{ArrowDown}");
    expect(value()).toBe("2");
    await userEvent.keyboard("{End}");
    expect(value()).toBe("10");
    await userEvent.keyboard("{ArrowUp}");
    expect(value()).toBe("10");
    await userEvent.keyboard("{Home}");
    expect(value()).toBe("1");
  });

  it("follows a valid number while it is being typed", async () => {
    const { input, value } = await setup();

    await input.fill("7");

    expect(value()).toBe("7");
    await expect.element(input).toHaveAttribute("aria-valuenow", "7");
    await expect.element(input).toHaveAttribute("aria-invalid", "false");
  });

  it("marks an invalid entry while typing and keeps the last valid quantity", async () => {
    const { input, value } = await setup();

    await input.fill("4");
    await input.fill("4x");

    expect(value()).toBe("4");
    await expect.element(input).toHaveAttribute("aria-invalid", "true");
  });

  it.each([
    ["25", "blur", "10", TOO_MANY],
    ["11", "enter", "10", TOO_MANY],
    ["0", "blur", "1", OUT_OF_RANGE],
    ["", "blur", "4", OUT_OF_RANGE],
    ["abc", "enter", "4", OUT_OF_RANGE],
    ["2.5", "blur", "4", OUT_OF_RANGE],
  ] as const)("corrects %j on %s to %s and says why", async (text, commit, expected, message) => {
    const { input, value, typeAndCommit, message: shown } = await setup();
    await input.fill("4");

    await typeAndCommit(text, commit);

    expect(value()).toBe(expected);
    await expect.element(input).toHaveValue(expected);
    await expect.element(input).toHaveAttribute("aria-invalid", "false");
    expect(shown()).toBe(message);
  });

  it("clears the message on the next valid change", async () => {
    const { input, increase, typeAndCommit, message } = await setup();

    await typeAndCommit("50", "blur");
    expect(message()).toBe(TOO_MANY);
    await input.fill("3");
    expect(message()).toBe("");

    await typeAndCommit("0", "blur");
    expect(message()).toBe(OUT_OF_RANGE);
    await increase.click();
    expect(message()).toBe("");
  });

  it("marks a button unavailable at its limit, where pressing it does nothing but focus stays possible", async () => {
    const { decrease, increase, value } = await setup();

    await expect.element(decrease).toHaveAttribute("aria-disabled", "true");
    await expect.element(increase).toHaveAttribute("aria-disabled", "false");
    // force: Playwright treats aria-disabled as disabled and would wait; a real user can still click it.
    await decrease.click({ force: true });
    decrease.element().focus();

    expect(value()).toBe("1");
    await expect.element(decrease).toHaveFocus();
  });

  it("looks the same at the limit as elsewhere, as in the reference", async () => {
    const { screen } = await setup();
    const style = (name: string) => getComputedStyle(screen.getByRole("button", { name }).element());

    expect(style("Decrease quantity").color).toBe(style("Increase quantity").color);
    expect(style("Decrease quantity").opacity).toBe("1");
  });

  it("has buttons of at least 44x44px", async () => {
    const { decrease, increase } = await setup();

    for (const button of [decrease, increase]) {
      const box = button.element().getBoundingClientRect();
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });

  it("has no WCAG 2.2 AA violations, including with a message showing", async () => {
    const { screen, typeAndCommit } = await setup();
    await expectNoAxeViolations(screen.container);

    await typeAndCommit("99", "blur");
    await expectNoAxeViolations(screen.container);
  });
});
