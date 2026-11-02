import { expect, test } from "@playwright/test";

test("the nav marks the current part on each page", async ({ page }) => {
  await page.goto("/?part=b");
  const nav = page.getByRole("navigation", { name: "Test parts" });
  await expect(nav.getByRole("link", { name: "Part B: Buy box" })).toHaveAttribute("aria-current", "page");
  await expect(nav.getByRole("link", { name: "Part A: Subscription page" })).not.toHaveAttribute("aria-current");

  await nav.getByRole("link", { name: "Part A: Subscription page" }).click();
  await expect(page).toHaveURL(/part=a/);
  await expect(nav.getByRole("link", { name: "Part A: Subscription page" })).toHaveAttribute("aria-current", "page");
});

test("a focused link's ring keeps clear space from the pill next to it", async ({ page, browserName }) => {
  // Safari doesn't move Tab focus to links by default, so the ring is checked with keyboard focus in Chromium.
  test.skip(browserName === "webkit", "Safari skips links when tabbing by default");
  await page.goto("/?part=a");
  const links = page.getByRole("navigation", { name: "Test parts" }).getByRole("link");
  while (!(await links.nth(1).evaluate((el) => el === document.activeElement))) await page.keyboard.press("Tab");

  const clearSpace = await links.nth(1).evaluate((link) => {
    const previous = link.closest("li")?.previousElementSibling?.querySelector("a");
    const style = getComputedStyle(link);
    const ringReach = parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset);
    return link.getBoundingClientRect().left - ringReach - (previous?.getBoundingClientRect().right ?? 0);
  });
  expect(clearSpace).toBeGreaterThanOrEqual(2);
});
