export type PurchaseOption = "one-time" | "subscribe";

interface OptionPrices {
  oneTimeCents: number;
  subscribeCents: number;
}

/** Price of one unit for the chosen purchase option. */
export function unitPriceCents(option: PurchaseOption, prices: OptionPrices): number {
  return option === "subscribe" ? prices.subscribeCents : prices.oneTimeCents;
}

/** What the customer pays for this order: the unit price times the quantity. */
export function orderTotalCents(option: PurchaseOption, quantity: number, prices: OptionPrices): number {
  return unitPriceCents(option, prices) * quantity;
}
