import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectNoAxeViolations } from "../test/axe";
import { SkipDialog, type SkipStatus } from "./SkipDialog";

const NEXT = "2026-11-08T15:00:00.000Z";

async function renderDialog(status: SkipStatus = "confirm") {
  const actions = { onConfirm: vi.fn(), onClose: vi.fn() };
  const screen = await render(<SkipDialog open status={status} nextChargeAt={NEXT} intervalDays={30} totalCents={10187} {...actions} />);
  return { screen, ...actions, dialog: screen.getByRole("dialog", { name: "Skip your Nov 8 delivery?" }) };
}

describe("SkipDialog", () => {
  it("states the consequence: no charge on the date, and when the next delivery will be", async () => {
    const { dialog } = await renderDialog();

    await expect.element(dialog).toBeVisible();
    await expect.element(dialog.getByText("You won't be charged $101.87 on Nov 8. Your next delivery will be Dec 8.")).toBeVisible();
  });

  it("starts with focus on the safe choice, and names the action on the confirm button", async () => {
    const { screen, onConfirm, onClose } = await renderDialog();

    await expect.element(screen.getByRole("button", { name: "Keep it" })).toHaveFocus();
    await screen.getByRole("button", { name: "Skip Nov 8 delivery" }).click();
    expect(onConfirm).toHaveBeenCalledOnce();
    await screen.getByRole("button", { name: "Keep it" }).click();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("while pending, shows progress and can't be confirmed twice", async () => {
    const { screen, onConfirm } = await renderDialog("pending");
    const confirm = screen.getByRole("button", { name: "Skipping..." });

    await expect.element(confirm).toHaveAttribute("aria-disabled", "true");
    // force: Playwright treats aria-disabled as disabled and would wait; a real user can still press it.
    await confirm.click({ force: true });
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("while pending, can't be closed by Keep it or Escape until the result is in", async () => {
    const { screen, dialog, onClose } = await renderDialog("pending");
    const keep = screen.getByRole("button", { name: "Keep it" });

    await expect.element(keep).toHaveAttribute("aria-disabled", "true");
    // Focus stays on Keep it, so the progress is announced in a status region, not by the button label.
    await expect.element(screen.getByRole("status")).toHaveTextContent("Skipping your delivery...");
    await keep.click({ force: true });
    await userEvent.keyboard("{Escape}");

    expect(onClose).not.toHaveBeenCalled();
    await expect.element(dialog).toBeVisible();
  });

  it("after a conflict, explains that nothing was skipped and shows the latest details", async () => {
    const { screen } = await renderDialog("conflict");

    expect(screen.getByRole("alert").element().textContent).toContain("Your subscription changed since you opened this page, so we didn't skip anything.");
    await expect.element(screen.getByRole("link", { name: "help@natura-wellness.example" })).not.toBeInTheDocument();
    await expect.element(screen.getByRole("button", { name: "Skip Nov 8 delivery" })).toBeVisible();
  });

  it("after repeated conflicts, also offers support", async () => {
    const { screen } = await renderDialog("repeated-conflict");

    await expect.element(screen.getByRole("link", { name: "help@natura-wellness.example" })).toHaveAttribute("href", "mailto:help@natura-wellness.example");
  });

  it("after an error, says nothing changed and offers to try again", async () => {
    const { screen, onConfirm } = await renderDialog("error");

    await expect.element(screen.getByRole("alert")).toHaveTextContent("We couldn't skip your delivery. Nothing changed. Please try again.");
    await screen.getByRole("button", { name: "Try again" }).click();
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("has no WCAG 2.2 AA violations in any status", async () => {
    for (const status of ["confirm", "pending", "conflict", "repeated-conflict", "error"] as const) {
      const { screen } = await renderDialog(status);
      await expectNoAxeViolations(screen.container);
      await screen.unmount();
    }
  });
});
