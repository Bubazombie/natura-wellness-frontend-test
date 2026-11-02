import { readFileSync, writeFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

// The reference is a 2x screenshot of a 1200px-wide window. The buy box starts 64px from the left
// and 56px from the top and is 1072px wide (CSS px). We compare only the box, so the app's nav bar
// above it doesn't matter; its horizontal placement is asserted separately.
const SCALE = 2;
const BOX = { x: 64, y: 56, width: 1072 };
// Per-pixel color tolerance (0 to 1). Text anti-aliasing differs between operating systems, so a
// perfect 0 isn't reachable; layout, size and color errors still show up far above this.
const PIXEL_THRESHOLD = 0.1;
// The finished build measures 1.25% in Chromium on Windows, almost all glyph rasterization and photo
// resampling (the reference was likely rendered on macOS). Every row was also checked to within 1px.
const MAX_MISMATCH_RATIO = 0.015;

function cropPng(source: PNG, x: number, y: number, width: number, height: number): PNG {
  const out = new PNG({ width, height });
  PNG.bitblt(source, out, x, y, width, height, 0, 0);
  return out;
}

test("buy box matches the reference at 1200px and 2x", async ({ page }, testInfo) => {
  await page.goto("/?part=b");
  await page.evaluate(() => document.fonts.ready);
  const box = page.getByRole("region", { name: "Vitamin D" });
  await expect(box).toBeVisible();

  const bounds = await box.boundingBox();
  expect(bounds?.x).toBeCloseTo(BOX.x, 0);
  expect(bounds?.width).toBeCloseTo(BOX.width, 0);

  if (!bounds) throw new Error("Buy box has no bounding box");
  // An element screenshot snaps its clip to whole CSS pixels, and the box can start on a half pixel
  // (the nav is 35.5px tall), so capture the page and crop in device pixels instead.
  const page2x = PNG.sync.read(await page.screenshot({ fullPage: true, scale: "device", animations: "disabled" }));
  const actual = cropPng(page2x, Math.round(bounds.x * SCALE), Math.round(bounds.y * SCALE), BOX.width * SCALE, Math.round(bounds.height * SCALE));
  const reference = PNG.sync.read(readFileSync("public/reference/buy-box.png"));
  const height = Math.min(actual.height, reference.height - BOX.y * SCALE);
  const expected = cropPng(reference, BOX.x * SCALE, BOX.y * SCALE, BOX.width * SCALE, height);
  const actualCropped = cropPng(actual, 0, 0, BOX.width * SCALE, height);

  const diff = new PNG({ width: expected.width, height });
  const mismatched = pixelmatch(actualCropped.data, expected.data, diff.data, expected.width, height, {
    threshold: PIXEL_THRESHOLD,
  });
  const ratio = mismatched / (expected.width * height);

  for (const [name, png] of [["actual", actualCropped], ["expected", expected], ["diff", diff]] as const) {
    const path = testInfo.outputPath(`${name}.png`);
    writeFileSync(path, PNG.sync.write(png));
    await testInfo.attach(name, { path, contentType: "image/png" });
  }

  expect(actual.height, "rendered box height (device px) vs reference content").toBeLessThanOrEqual(reference.height - BOX.y * SCALE);
  expect(ratio, `${(ratio * 100).toFixed(2)}% of pixels differ; see diff.png`).toBeLessThan(MAX_MISMATCH_RATIO);
});
