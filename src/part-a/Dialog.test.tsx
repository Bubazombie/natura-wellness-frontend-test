import { useRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectNoAxeViolations } from "../test/axe";
import { Dialog } from "./Dialog";

function Harness({ onClose, dismissible }: { onClose?: () => void; dismissible?: boolean }) {
  const [open, setOpen] = useState(false);
  const focusRef = useRef<HTMLButtonElement>(null);
  const close = () => {
    onClose?.();
    setOpen(false);
  };
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
      >
        Open
      </button>
      <Dialog open={open} onClose={close} titleId="title" initialFocus={focusRef} dismissible={dismissible}>
        <h2 id="title">Dialog title</h2>
        <button type="button">First</button>
        <button ref={focusRef} type="button" onClick={close}>
          Safe choice
        </button>
      </Dialog>
    </>
  );
}

describe("Dialog", () => {
  it("opens as a modal named by its title, with focus on the chosen element", async () => {
    const screen = await render(<Harness />);

    await screen.getByRole("button", { name: "Open" }).click();

    const dialog = screen.getByRole("dialog", { name: "Dialog title" });
    await expect.element(dialog).toBeVisible();
    expect(dialog.element().matches(":modal")).toBe(true);
    await expect.element(screen.getByRole("button", { name: "Safe choice" })).toHaveFocus();
  });

  it("closes on Escape through onClose, and returns focus to the button that opened it", async () => {
    const onClose = vi.fn();
    const screen = await render(<Harness onClose={onClose} />);
    const opener = screen.getByRole("button", { name: "Open" });

    await opener.click();
    await userEvent.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledOnce();
    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
    await expect.element(opener).toHaveFocus();
  });

  it("ignores Escape and is marked busy while it isn't dismissible", async () => {
    const onClose = vi.fn();
    const screen = await render(<Harness onClose={onClose} dismissible={false} />);

    await screen.getByRole("button", { name: "Open" }).click();
    await userEvent.keyboard("{Escape}");

    expect(onClose).not.toHaveBeenCalled();
    await expect.element(screen.getByRole("dialog")).toHaveAttribute("aria-busy", "true");
  });

  it("closes when its open prop turns false", async () => {
    const screen = await render(<Harness />);

    await screen.getByRole("button", { name: "Open" }).click();
    await screen.getByRole("button", { name: "Safe choice" }).click();

    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
  });

  it("has no WCAG 2.2 AA violations when open", async () => {
    const screen = await render(<Harness />);
    await screen.getByRole("button", { name: "Open" }).click();

    await expectNoAxeViolations(screen.container);
  });
});
