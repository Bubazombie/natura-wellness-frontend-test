import { formatPrice } from "../lib/money";

/**
 * The auto-renewal disclosure for the current selection. copy.finePrint hardcodes the default
 * frequency and price, so the sentence is built here; finePrint.test.ts keeps the two in sync.
 */
export function buildFinePrint(frequency: string, totalCents: number): string {
  return `Your subscription renews every ${frequency} at ${formatPrice(totalCents)} until you cancel. Skip or cancel anytime from your account.`;
}
