import { expect } from "vitest";
import type { Locator } from "vitest/browser";

/**
 * Collapsed content stays in the DOM (so it can animate) but must end up invisible and inside an
 * inert container, out of the Tab order and the accessibility tree. Role queries stop finding it
 * once it is hidden; text queries still find it, so for those the inert container is checked too.
 */
export async function expectCollapsed(locator: Locator): Promise<void> {
  await expect
    .poll(() => {
      const element = locator.query();
      return element === null || !element.checkVisibility({ visibilityProperty: true });
    })
    .toBe(true);

  const element = locator.query();
  if (element) expect(element.closest("[inert]"), "collapsed content must be inside an inert container").not.toBeNull();
}
