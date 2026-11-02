import type { SubscriptionItem } from "../api/types";
import { formatPrice } from "../lib/money";
import { lineTotalCents } from "./summary";

function ProductThumb({ item }: { item: SubscriptionItem }) {
  const frame = "size-14 shrink-0 overflow-hidden rounded-xl border border-line bg-surface";
  // The name is right next to the thumbnail, so the image is decorative (empty alt).
  if (item.imageUrl) return <img src={item.imageUrl} alt="" className={`${frame} object-cover`} />;
  return (
    <span aria-hidden="true" className={`${frame} flex items-center justify-center bg-surface-selected font-display text-xl font-semibold text-brand`}>
      {item.name.charAt(0)}
    </span>
  );
}

export function ItemList({ items }: { items: SubscriptionItem[] }) {
  return (
    <ul className="divide-y divide-line">
      {items.map((item) => (
        <li key={item.sku} className="flex items-center gap-4 py-4 first:pt-0">
          <ProductThumb item={item} />
          <div className="min-w-0 flex-1">
            <p className="font-medium">{item.name}</p>
            <p className="text-sm text-ink-muted">
              Qty {item.quantity} · {formatPrice(item.unitPriceCents)} each
            </p>
          </div>
          <p className="font-medium">{formatPrice(lineTotalCents(item))}</p>
        </li>
      ))}
    </ul>
  );
}
