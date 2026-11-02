import type { SubscriptionStatus } from "../api/types";
import { StatusBadge } from "./StatusBadge";

/**
 * The page's one h1, shown in every state, with the status badge once the status is known. On
 * phones the badge always sits under the title: "Cancelled" doesn't fit beside it at 375px, and the
 * badge shouldn't move between states.
 */
export function PageHeader({ status }: { status?: SubscriptionStatus }) {
  return (
    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <h1 className="font-display text-3xl font-semibold text-brand sm:text-4xl">Your subscription</h1>
      {status && <StatusBadge status={status} />}
    </div>
  );
}
