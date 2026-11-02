import type { CatalogProduct, SubscriptionItem } from "../api/types";

export interface SwapOption {
  from: SubscriptionItem;
  to: CatalogProduct;
}

/**
 * Every swap worth offering: each item in the subscription, for each product the customer doesn't
 * have yet that isn't a bundle containing the item being replaced (that would be the same product
 * again, plus more).
 */
export function swapOptions(items: SubscriptionItem[], catalog: CatalogProduct[], bundleContents: Record<string, readonly string[]>): SwapOption[] {
  const owned = new Set(items.map((item) => item.sku));
  return items.flatMap((from) =>
    catalog.filter((to) => !owned.has(to.sku) && !(bundleContents[to.sku] ?? []).includes(from.sku)).map((to) => ({ from, to })),
  );
}
