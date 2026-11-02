const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** Formats an amount in cents as US dollars, for example 2546 as "$25.46". */
export function formatPrice(cents: number): string {
  return usd.format(cents / 100);
}
