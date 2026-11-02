import { totalAfterDiscount } from "../api/fixtures";
import type { Subscription, SubscriptionItem } from "../api/types";

export interface PriceSummary {
  subtotalCents: number;
  savingsCents: number;
  totalCents: number;
  itemCount: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** When the next delivery would be after skipping one: one interval later, as the API does it. */
export function dateAfterSkip(nextChargeAt: string, intervalDays: number): string {
  return new Date(Date.parse(nextChargeAt) + intervalDays * DAY_MS).toISOString();
}

export function lineTotalCents(item: SubscriptionItem): number {
  return item.unitPriceCents * item.quantity;
}

/**
 * List prices per line, the saving as one line, and the server's total when it has one. Deriving
 * the saving from the total keeps the lines adding up; rounding each discounted line would not.
 */
export function priceSummary(subscription: Subscription): PriceSummary {
  const subtotalCents = subscription.items.reduce((sum, item) => sum + lineTotalCents(item), 0);
  const totalCents = subscription.nextChargeTotalCents ?? totalAfterDiscount(subscription.items, subscription.discountPercent);
  return {
    subtotalCents,
    savingsCents: subtotalCents - totalCents,
    totalCents,
    itemCount: subscription.items.reduce((sum, item) => sum + item.quantity, 0),
  };
}
