import type { SubscriptionStatus } from "../api/types";

const styles: Record<SubscriptionStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-surface-selected text-brand ring-1 ring-brand/30" },
  // Paused and cancelled are deliberately neutral, so they never read as active.
  paused: { label: "Paused", className: "bg-line text-ink-muted" },
  cancelled: { label: "Cancelled", className: "bg-line text-ink-muted" },
};

export function StatusBadge({ status }: { status: SubscriptionStatus }) {
  const { label, className } = styles[status];
  return <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${className}`}>{label}</span>;
}
