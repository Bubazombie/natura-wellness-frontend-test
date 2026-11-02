// Small presentational pieces of the page shell: Notice, PageHeader and StatusBadge.
import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import type { SubscriptionStatus } from "../api/types";
import { expectNoAxeViolations } from "../test/axe";
import { Notice } from "./Notice";
import { PageHeader } from "./PageHeader";
import { StatusBadge } from "./StatusBadge";

describe("Notice", () => {
  it("shows its message in a status live region", async () => {
    const screen = await render(<Notice>Your delivery is skipped.</Notice>);

    await expect.element(screen.getByRole("status")).toHaveTextContent("Your delivery is skipped.");
  });

  it("keeps the live region rendered but takes no space when empty", async () => {
    const screen = await render(<Notice>{null}</Notice>);
    const region = screen.getByRole("status");

    await expect.element(region).toBeInTheDocument();
    expect(region.element().getBoundingClientRect().height).toBe(0);
  });
});

describe("PageHeader", () => {
  it("is the page's h1, with the status badge when the status is known", async () => {
    const withStatus = await render(<PageHeader status="paused" />);
    await expect.element(withStatus.getByRole("heading", { level: 1, name: "Your subscription" })).toBeVisible();
    await expect.element(withStatus.getByText("Paused")).toBeVisible();
    await withStatus.unmount();

    const withoutStatus = await render(<PageHeader />);
    await expect.element(withoutStatus.getByRole("heading", { level: 1, name: "Your subscription" })).toBeVisible();
    expect(withoutStatus.container.textContent).toBe("Your subscription");
  });
});

describe("PageHeader layout", () => {
  it("puts the badge in the same place in every state at 375px: under the title", async () => {
    await page.viewport(375, 812);
    const positions: string[] = [];
    for (const status of ["active", "paused", "cancelled"] as const) {
      const screen = await render(<PageHeader status={status} />);
      const title = screen.getByRole("heading", { level: 1 }).element().getBoundingClientRect();
      const badge = screen.getByText(status === "active" ? "Active" : status === "paused" ? "Paused" : "Cancelled").element().getBoundingClientRect();
      positions.push(`${status}: ${badge.top >= title.bottom ? "under" : "beside"}, left ${String(Math.round(badge.left - title.left))}`);
      await screen.unmount();
    }

    expect(positions).toEqual(["active: under, left 0", "paused: under, left 0", "cancelled: under, left 0"]);
  });
});

describe("StatusBadge", () => {
  it.each([
    ["active", "Active"],
    ["paused", "Paused"],
    ["cancelled", "Cancelled"],
  ] as const)("labels %s as %s", async (status, label) => {
    const screen = await render(<StatusBadge status={status} />);

    await expect.element(screen.getByText(label)).toBeVisible();
  });

  it("styles paused and cancelled differently from active, so they never read as active", async () => {
    const color = async (status: SubscriptionStatus) => {
      const screen = await render(<StatusBadge status={status} />);
      const value = getComputedStyle(screen.container.querySelector("span") ?? document.body).backgroundColor;
      await screen.unmount();
      return value;
    };

    const active = await color("active");
    expect(await color("paused")).not.toBe(active);
    expect(await color("cancelled")).not.toBe(active);
  });

  it("has no WCAG 2.2 AA violations in any status", async () => {
    const screen = await render(
      <>
        <StatusBadge status="active" />
        <StatusBadge status="paused" />
        <StatusBadge status="cancelled" />
      </>,
    );

    await expectNoAxeViolations(screen.container);
  });
});
