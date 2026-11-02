import AxeBuilder from "@axe-core/playwright";
import { expect as baseExpect, test } from "@playwright/test";
import { WCAG_AA_TAGS } from "../src/test/a11y";

// Against the real mock API, which waits up to 2.5s per call. The error fixture fails twice (the
// load retries a 5xx once, after a 1s delay), so its message can take about 6s to appear.
const expect = baseExpect.configure({ timeout: 12_000 });

const axe = async (page: import("@playwright/test").Page) => (await new AxeBuilder({ page }).withTags(WCAG_AA_TAGS).analyze()).violations.map((v) => v.id);

for (const [fixture, heading] of [
  ["active", "Next delivery"],
  ["paused", "Your deliveries are paused"],
  ["cancelled", "Your subscription is cancelled"],
  ["error", "We couldn't load your subscription"],
  ["unknown", "We couldn't find a subscription on your account"],
] as const) {
  test(`${fixture}: one h1, the right state, no console errors and no WCAG 2.2 AA violations`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    await page.goto(`/?part=a&fixture=${fixture}`);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your subscription");
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    expect(await axe(page)).toEqual([]);
    expect(errors).toEqual([]);
  });
}

for (const [button, dialog] of [
  ["Skip this delivery", /^Skip your .+ delivery\?$/],
  ["Pause deliveries", "Pause your deliveries"],
  ["Cancel subscription", "Before you go"],
] as const) {
  test(`"${button}" opens an accessible modal by keyboard, and Escape returns focus to it`, async ({ page }) => {
    await page.goto("/?part=a&fixture=active");
    const trigger = page.getByRole("main").getByRole("button", { name: button });

    await trigger.focus();
    await page.keyboard.press("Enter");
    const modal = page.getByRole("dialog", { name: dialog });
    await expect(modal).toBeVisible();
    expect(await modal.evaluate((el) => el.matches(":modal"))).toBe(true);
    expect(await axe(page)).toEqual([]);

    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden();
    await expect(trigger).toBeFocused();
  });
}

test("Tab stays inside an open dialog", async ({ page }) => {
  await page.goto("/?part=a&fixture=active");
  await page.getByRole("button", { name: "Skip this delivery" }).click();
  const dialog = page.getByRole("dialog");

  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate((el) => el.contains(document.activeElement) || document.activeElement === document.body)).toBe(true);
  }
});
