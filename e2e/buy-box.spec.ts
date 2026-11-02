import { expect, test, type Locator } from "@playwright/test";

const BRAND = "rgb(23, 64, 47)";

async function expectBrandFocusRing(element: Locator) {
  await expect(element).toBeFocused();
  const ring = await element.evaluate((el) => {
    const style = getComputedStyle(el);
    return { style: style.outlineStyle, width: style.outlineWidth, color: style.outlineColor, offset: style.outlineOffset };
  });
  expect(ring).toEqual({ style: "solid", width: "2px", color: BRAND, offset: "2px" });
}

test.beforeEach(async ({ page }) => {
  await page.goto("/?part=b");
});

test("can be completed with the keyboard alone, with a visible focus ring on every stop", async ({ page }) => {
  const box = page.getByRole("region", { name: "Vitamin D" });
  const subscribe = box.getByRole("radio", { name: /Subscribe/ });
  const oneTime = box.getByRole("radio", { name: /One-time/ });
  const addToCart = box.getByRole("button", { name: /Add to cart/ });

  // Tab in from the top like a keyboard user. WebKit only shows :focus-visible for keyboard focus,
  // and Safari may skip links when tabbing, so walk until the purchase options are reached.
  for (let i = 0; i < 6 && !(await subscribe.evaluate((el) => el === document.activeElement)); i++) {
    await page.keyboard.press("Tab");
  }

  // A radio group is one tab stop that lands on the checked option; arrows move the selection.
  await expectBrandFocusRing(subscribe);
  await page.keyboard.press("ArrowUp");
  await expectBrandFocusRing(oneTime);
  await expect(oneTime).toBeChecked();
  await expect(addToCart).toHaveAccessibleName("Add to cart $29.95");

  await page.keyboard.press("ArrowDown");
  await expect(subscribe).toBeChecked();
  await page.keyboard.press("Tab");
  const frequency = box.getByRole("combobox", { name: "Delivered every" });
  await expectBrandFocusRing(frequency);
  await frequency.selectOption("90 days");

  // Decrease is unavailable at quantity 1 but stays a Tab stop, and pressing it changes nothing.
  await page.keyboard.press("Tab");
  await expectBrandFocusRing(box.getByRole("button", { name: "Decrease quantity" }));
  await page.keyboard.press("Enter");
  await expect(box.getByRole("textbox", { name: "Quantity" })).toHaveValue("1");
  await page.keyboard.press("Tab");
  await expectBrandFocusRing(box.getByRole("textbox", { name: "Quantity" }));
  await page.keyboard.press("Tab");
  const increase = box.getByRole("button", { name: "Increase quantity" });
  await expectBrandFocusRing(increase);
  await page.keyboard.press("Enter");
  await page.keyboard.press("Space");

  await expect(box.getByRole("textbox", { name: "Quantity" })).toHaveValue("3");
  await expect(addToCart).toHaveAccessibleName("Add to cart $76.38");
  await expect(box.getByText("Your subscription renews every 90 days at $76.38 until you cancel.", { exact: false })).toBeVisible();

  await page.keyboard.press("Tab");
  await expectBrandFocusRing(addToCart);
});

test("never scrolls sideways and keeps the main action on one line", async ({ page }) => {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0);

  const button = page.getByRole("button", { name: /Add to cart/ });
  const lineHeight = await button.evaluate((el) => parseFloat(getComputedStyle(el).lineHeight));
  const textHeight = await button.evaluate((el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    return range.getBoundingClientRect().height;
  });
  expect(textHeight).toBeLessThanOrEqual(lineHeight * 1.5);
});

test("shows the focus ring on the reviews link when reached with the keyboard", async ({ page, browserName }) => {
  // Safari doesn't move Tab focus to links unless the user turns that on, so this runs in Chromium.
  test.skip(browserName === "webkit", "Safari skips links when tabbing by default");
  const link = page.getByRole("link", { name: "2,316 reviews" });
  for (let i = 0; i < 6 && !(await link.evaluate((el) => el === document.activeElement)); i++) {
    await page.keyboard.press("Tab");
  }
  await expectBrandFocusRing(link);
});
