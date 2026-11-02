import { expect, test } from "@playwright/test";
import { sweepWidths } from "./support/layout";

for (const fixture of ["active", "paused", "cancelled", "error", "unknown"]) {
  test(`the ${fixture} page fits at every width from 320 to 1440px`, async ({ page }) => {
    await page.goto(`/?part=a&fixture=${fixture}`);
    await page.evaluate(() => document.fonts.ready);

    expect(await sweepWidths(page, { root: "main" })).toEqual([]);
  });
}

test("every step of the cancel flow fits at every width", async ({ page }) => {
  await page.goto("/?part=a&fixture=active");
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole("button", { name: "Cancel subscription" }).click();
  expect(await sweepWidths(page, { root: "dialog[open]" })).toEqual([]);

  for (const reason of ["I have too much product left", "It costs too much", "I'm trying a different product", "I didn't see results"]) {
    await page.getByRole("radio", { name: reason }).check();
    await page.getByRole("button", { name: "Continue" }).click();
    expect(await sweepWidths(page, { root: "dialog[open]" }), reason).toEqual([]);
    await page.getByRole("button", { name: "Back" }).click();
  }
});
