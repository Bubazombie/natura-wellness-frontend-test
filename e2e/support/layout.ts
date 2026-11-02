import type { Page } from "@playwright/test";

// Resizes one page from phone to large desktop in small steps and reports every width where text
// overflows its box or the page scrolls sideways, plus any extra check a caller passes in.
const MIN_WIDTH = 320;
const MAX_WIDTH = 1440;
const STEP = 2;

interface SweepOptions {
  /** CSS selector of the region whose elements are checked for overflow. */
  root: string;
  /** The largest the photo card may get, for pages that have one. */
  maxPhotoWidth?: number;
}

async function problemsAt(page: Page, width: number, { root, maxPhotoWidth }: SweepOptions): Promise<string[]> {
  await page.setViewportSize({ width, height: 900 });
  return page.evaluate(
    ({ root, maxPhotoWidth }) => {
      const problems: string[] = [];
      const scroll = document.documentElement.scrollWidth - window.innerWidth;
      if (scroll > 0) problems.push(`page scrolls sideways by ${String(scroll)}px`);

      const container = document.querySelector(root);
      if (!container) return [`${root} not found`];
      for (const el of container.querySelectorAll<HTMLElement>("*")) {
        const style = getComputedStyle(el);
        // Inline boxes report no client width, and .sr-only text is clipped on purpose.
        if (style.display === "inline" || el.closest(".sr-only") || el instanceof SVGElement) continue;
        if (el.scrollWidth > el.clientWidth + 1) {
          const name = (el.textContent ?? "").trim().slice(0, 40) || el.tagName.toLowerCase();
          problems.push(`"${name}" overflows its box (${String(el.scrollWidth)}px in ${String(el.clientWidth)}px)`);
        }
      }

      const photo = container.querySelector("img")?.parentElement?.getBoundingClientRect();
      if (maxPhotoWidth !== undefined && photo && photo.width > maxPhotoWidth + 0.5) {
        problems.push(`photo card is ${String(Math.round(photo.width))}px, more than ${String(maxPhotoWidth)}px`);
      }
      return problems;
    },
    { root, maxPhotoWidth },
  );
}

/** Problems grouped by kind, each with the range of widths it happens at, e.g. "348-356px: ...". */
export async function sweepWidths(page: Page, options: SweepOptions): Promise<string[]> {
  const byProblem = new Map<string, number[]>();
  for (let width = MIN_WIDTH; width <= MAX_WIDTH; width += STEP) {
    for (const problem of await problemsAt(page, width, options)) {
      const key = problem.replace(/\d+px in \d+px|\d+px, more/, "#");
      byProblem.set(key, [...(byProblem.get(key) ?? []), width]);
    }
  }
  return [...byProblem].map(([problem, widths]) => `${String(widths[0])}-${String(widths.at(-1))}px: ${problem}`);
}
