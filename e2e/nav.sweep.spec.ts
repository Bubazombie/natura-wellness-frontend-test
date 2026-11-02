import { expect, test } from "@playwright/test";

const ONE_ROW_MAX_HEIGHT = 64;

test("the header stays on one row, without overflow, at every width from 320 to 1440px", async ({ page }) => {
  await page.goto("/?part=b");
  await page.evaluate(() => document.fonts.ready);
  const problems: string[] = [];

  for (let width = 320; width <= 1440; width += 4) {
    await page.setViewportSize({ width, height: 600 });
    const { height, overflow } = await page.evaluate(() => {
      const header = document.querySelector("header");
      return { height: header?.getBoundingClientRect().height ?? 0, overflow: document.documentElement.scrollWidth - window.innerWidth };
    });
    if (height > ONE_ROW_MAX_HEIGHT) problems.push(`${String(width)}px: header is ${String(Math.round(height))}px tall`);
    if (overflow > 0) problems.push(`${String(width)}px: page scrolls sideways by ${String(overflow)}px`);
  }

  expect(problems).toEqual([]);
});
