import { formatPrice } from "../lib/money";
import type { PriceSummary as Summary } from "./summary";

interface PriceSummaryProps {
  summary: Summary;
  discountPercent: number;
}

export function PriceSummary({ summary, discountPercent }: PriceSummaryProps) {
  const row = "flex justify-between gap-4";
  return (
    <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
      <div className={row}>
        <dt className="text-ink-muted">Subtotal</dt>
        <dd>{formatPrice(summary.subtotalCents)}</dd>
      </div>
      <div className={row}>
        <dt className="text-ink-muted">Subscription savings ({discountPercent}%)</dt>
        <dd className="text-brand">−{formatPrice(summary.savingsCents)}</dd>
      </div>
      <div className={row}>
        <dt className="text-ink-muted">Shipping</dt>
        <dd>Free</dd>
      </div>
      <div className={`${row} border-t border-line pt-3 text-base font-semibold`}>
        <dt>Total per delivery</dt>
        <dd>{formatPrice(summary.totalCents)}</dd>
      </div>
    </dl>
  );
}
