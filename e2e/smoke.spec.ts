import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { WCAG_AA_TAGS } from "../src/test/a11y";

const pages = [
  { name: "Part A", path: "/?part=a&fixture=active" },
  { name: "Part B", path: "/?part=b" },
];

for (const { name, path } of pages) {
  test(`${name} loads without console errors or WCAG 2.2 AA violations`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    await page.goto(path);
    await expect(page.getByRole("navigation")).toBeVisible();

    const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA_TAGS).analyze();
    expect(violations.map((v) => v.id)).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
}
