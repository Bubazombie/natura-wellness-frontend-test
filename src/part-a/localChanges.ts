import { totalAfterDiscount } from "../api/fixtures";
import type { CatalogProduct, Subscription, SubscriptionItem, SubscriptionStatus } from "../api/types";
import { addMonths, DAY_MS } from "../lib/dates";
import { dateAfterSkip } from "./summary";

// Only skipping exists in the API, so every other change is simulated here: a layer of local
// changes on top of the server's data. A successful skip or a refetch replaces the server data
// underneath, and the local changes still apply on top.
export interface LocalChanges {
  status?: SubscriptionStatus;
  intervalDays?: number;
  items?: SubscriptionItem[];
  /** Set when the date the customer should see differs from the server's (see afterSkip). */
  nextChargeAt?: string;
  pausedUntil?: string;
  cancelledAt?: string;
}

/** What the customer sees: the server's subscription with the local changes applied. */
export function applyChanges(server: Subscription, changes: LocalChanges): Subscription {
  const status = changes.status ?? server.status;
  const items = changes.items ?? server.items;
  const active = status === "active";
  const serverTotal = server.nextChargeTotalCents ?? totalAfterDiscount(items, server.discountPercent);
  return {
    ...server,
    status,
    items,
    intervalDays: changes.intervalDays ?? server.intervalDays,
    nextChargeAt: active ? (changes.nextChargeAt ?? server.nextChargeAt) : null,
    // The server's total is used unless the items changed; then it is recomputed the same way.
    nextChargeTotalCents: active ? (changes.items ? totalAfterDiscount(items, server.discountPercent) : serverTotal) : null,
    pausedUntil: status === "paused" ? (changes.pausedUntil ?? server.pausedUntil) : null,
    cancelledAt: status === "cancelled" ? (changes.cancelledAt ?? server.cancelledAt) : null,
  };
}

/** The new frequency applies after the next delivery, which keeps its date. */
export function withFrequency(changes: LocalChanges, intervalDays: number): LocalChanges {
  return { ...changes, intervalDays };
}

export function withQuantity(changes: LocalChanges, shown: Subscription, sku: string, quantity: number): LocalChanges {
  return { ...changes, items: shown.items.map((item) => (item.sku === sku ? { ...item, quantity } : item)) };
}

/** The new product takes the replaced one's place and quantity. */
export function withSwap(changes: LocalChanges, shown: Subscription, fromSku: string, to: CatalogProduct): LocalChanges {
  return { ...changes, items: shown.items.map((item) => (item.sku === fromSku ? { ...to, quantity: item.quantity } : item)) };
}

/** Deliveries resume the given number of months from today. */
export function paused(changes: LocalChanges, months: number, now: Date): LocalChanges {
  return { ...changes, status: "paused", pausedUntil: addMonths(now, months).toISOString() };
}

/** Resuming or restarting delivers tomorrow, so the customer gets what they just asked for soon. */
export function reactivated(changes: LocalChanges, now: Date): LocalChanges {
  return { ...changes, status: "active", nextChargeAt: new Date(now.getTime() + DAY_MS).toISOString() };
}

export function cancelled(changes: LocalChanges, now: Date): LocalChanges {
  return { ...changes, status: "cancelled", cancelledAt: now.toISOString() };
}

/**
 * After a skip, keep the date the customer's own choices imply. The server moves the date by its
 * own interval (always 30 days in the mock), so when the frequency was changed here, or the date
 * already differs from the server's, or the skip was simulated, the date is set locally instead.
 */
export function afterSkip(changes: LocalChanges, before: Subscription, server: Subscription, simulated: boolean): LocalChanges {
  const diverged = changes.nextChargeAt !== undefined || before.intervalDays !== server.intervalDays;
  if (!simulated && !diverged) return changes;
  if (!before.nextChargeAt) return changes;
  return { ...changes, nextChargeAt: dateAfterSkip(before.nextChargeAt, before.intervalDays) };
}
