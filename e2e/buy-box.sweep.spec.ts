import { expect, test, type Page } from "@playwright/test";

// Resizes one page from phone to large desktop in small steps and fails on any width where text
// overflows its box, the page scrolls sideways, or the photo grows past its size in the reference.
const MIN_WIDTH = 320;
const MAX_WIDTH = 1440;
const STEP = 2;
const MAX_PHOTO_CARD = 540;

interface LayoutProblem {
  width: number;
  problem: string;
}

async function layoutProblems(page: Page, width: number): Promise<LayoutProblem[]> {
  await page.setViewportSize({ width, height: 900 });
  return page.evaluate(
    ({ width, maxPhoto }) => {
      const problems: string[] = [];
      const scroll = document.documentElement.scrollWidth - window.innerWidth;
      if (scroll > 0) problems.push(`page scrolls sideways by ${String(scroll)}px`);

      const box = document.querySelector("section");
      if (!box) return [{ width, problem: "buy box not found" }];
      for (const el of box.querySelectorAll<HTMLElement>("*")) {
        const style = getComputedStyle(el);
        // Inline boxes report no client width, and .sr-only text is clipped on purpose.
        if (style.display === "inline" || el.closest(".sr-only") || el instanceof SVGElement) continue;
        if (el.scrollWidth > el.clientWidth + 1) {
          const name = (el.textContent ?? "").trim().slice(0, 40) || el.tagName.toLowerCase();
          problems.push(`"${name}" overflows its box (${String(el.scrollWidth)}px in ${String(el.clientWidth)}px)`);
        }
      }

      const photo = box.querySelector("img")?.parentElement?.getBoundingClientRect();
      if (photo && photo.width > maxPhoto + 0.5) problems.push(`photo card is ${String(Math.round(photo.width))}px, more than ${String(maxPhoto)}px`);
      return problems.map((problem) => ({ width, problem }));
    },
    { width, maxPhoto: MAX_PHOTO_CARD },
  );
}

async function sweep(page: Page): Promise<string[]> {
  const found: LayoutProblem[] = [];
  for (let width = MIN_WIDTH; width <= MAX_WIDTH; width += STEP) found.push(...(await layoutProblems(page, width)));

  // Group widths by problem (ignoring the exact pixel sizes), so the report reads "348-356px: ...".
  const byProblem = new Map<string, number[]>();
  for (const { width, problem } of found) {
    const key = problem.replace(/\d+px in \d+px|\d+px, more/, "#");
    byProblem.set(key, [...(byProblem.get(key) ?? []), width]);
  }
  return [...byProblem].map(([problem, widths]) => `${String(widths[0])}-${String(widths.at(-1))}px: ${problem}`);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/?part=b");
  await page.evaluate(() => document.fonts.ready);
});

test("default selection fits at every width from 320 to 1440px", async ({ page }) => {
  expect(await sweep(page)).toEqual([]);
});

test("the widest prices (quantity 10) fit at every width", async ({ page }) => {
  const quantity = page.getByRole("textbox", { name: "Quantity" });
  while ((await quantity.inputValue()) !== "10") await page.getByRole("button", { name: "Increase quantity" }).click();

  expect(await sweep(page)).toEqual([]);
  await page.getByRole("radio", { name: /One-time/ }).check();
  expect(await sweep(page)).toEqual([]);
});
