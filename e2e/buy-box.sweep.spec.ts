import { expect, test, type Page } from "@playwright/test";
import { sweepWidths } from "./support/layout";

// The photo card must never grow past its size in the reference.
const sweep = (page: Page) => sweepWidths(page, { root: "section", maxPhotoWidth: 540 });

test.beforeEach(async ({ page }) => {
  await page.goto("/?part=b");
  await page.evaluate(() => document.fonts.ready);
});

test("default selection fits at every width from 320 to 1440px", async ({ page }) => {
  expect(await sweep(page)).toEqual([]);
});

test("the widest prices (quantity 10) fit at every width", async ({ page }) => {
  const quantity = page.getByRole("spinbutton", { name: "Quantity" });
  while ((await quantity.inputValue()) !== "10") await page.getByRole("button", { name: "Increase quantity" }).click();

  expect(await sweep(page)).toEqual([]);
  await page.getByRole("radio", { name: /One-time/ }).check();
  expect(await sweep(page)).toEqual([]);
});
