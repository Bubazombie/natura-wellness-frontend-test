import axe from "axe-core";
import { expect } from "vitest";
import { WCAG_AA_TAGS } from "./a11y";

/** Runs axe against a rendered element and fails with a readable list of WCAG 2.2 AA violations. */
export async function expectNoAxeViolations(element: Element): Promise<void> {
  const { violations } = await axe.run(element, { runOnly: { type: "tag", values: WCAG_AA_TAGS } });
  const summary = violations.map((v) => `${v.id}: ${v.help} (${String(v.nodes.length)} nodes)`);
  // Explicit message, because Vitest abbreviates arrays in assertion messages and would hide the rule ids.
  expect(summary, `axe found WCAG 2.2 AA violations:\n${summary.join("\n")}`).toEqual([]);
}
