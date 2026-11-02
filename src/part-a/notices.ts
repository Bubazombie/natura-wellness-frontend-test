import type { CatalogProduct, Subscription, SubscriptionItem } from "../api/types";
import { formatShortDate, formatWeekdayDate } from "../lib/dates";
import { formatPrice } from "../lib/money";

// Setting changes (skip, frequency, quantity, swap) get a visible notice. Status changes (pause,
// resume, restart, cancel) change the summary card itself, which receives focus, so they are only
// announced to screen readers, not repeated on screen.

export function skippedNotice(skippedDate: string, after: Subscription): string {
  const next = after.nextChargeAt ? ` Your next delivery is ${formatShortDate(after.nextChargeAt)}.` : "";
  return `Done. Your ${formatShortDate(skippedDate)} delivery is skipped.${next}`;
}

export function frequencyNotice(after: Subscription): string {
  const next = after.nextChargeAt ? `Your ${formatShortDate(after.nextChargeAt)} delivery is unchanged. After that, ` : "From now on, ";
  return `${next}you'll get a delivery every ${String(after.intervalDays)} days.`;
}

export function quantityNotice(item: SubscriptionItem, after: Subscription): string {
  const total = after.nextChargeTotalCents === null ? "" : `, for ${formatPrice(after.nextChargeTotalCents)} per delivery`;
  return `Done. You'll get ${String(item.quantity)} of ${item.name} in each delivery${total}.`;
}

export function swapNotice(from: SubscriptionItem, to: CatalogProduct): string {
  return `Done. ${to.name} replaces ${from.name} from your next delivery.`;
}

/** Read out after a status change; the card on screen already shows the same, so it stays hidden. */
export function statusAnnouncement(after: Subscription): string {
  if (after.status === "paused") {
    return `Your deliveries are paused.${after.pausedUntil ? ` They resume on ${formatWeekdayDate(after.pausedUntil)}.` : ""}`;
  }
  if (after.status === "cancelled") return "Your subscription is cancelled. You won't be charged again.";
  return `Your subscription is active.${after.nextChargeAt ? ` Your next delivery is ${formatWeekdayDate(after.nextChargeAt)}.` : ""}`;
}
