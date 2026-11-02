import { useId } from "react";
import type { Subscription } from "../api/types";
import { formatShortDate, formatWeekdayDate, formatWhen } from "../lib/dates";
import { formatPrice } from "../lib/money";
import { Button } from "./Button";
import { priceSummary } from "./summary";

interface StatusSummaryProps {
  subscription: Subscription;
  onSkip: () => void;
  onResume: () => void;
  onRestart: () => void;
}

const cardClass = "rounded-card border border-line-option bg-surface p-5 sm:p-6";
const eyebrowClass = "text-caption font-semibold tracking-caps text-ink-subtle uppercase";

/** The answer to "what happens next", which is different for each status. */
export function StatusSummary({ subscription, onSkip, onResume, onRestart }: StatusSummaryProps) {
  const headingId = useId();
  const { status, nextChargeAt, pausedUntil, cancelledAt } = subscription;

  if (status === "active" && nextChargeAt) {
    const { totalCents, itemCount } = priceSummary(subscription);
    return (
      <section aria-labelledby={headingId} className={cardClass}>
        <h2 id={headingId} className={eyebrowClass}>
          Next delivery
        </h2>
        <p className="mt-2 font-display text-3xl font-semibold text-brand">{formatWeekdayDate(nextChargeAt)}</p>
        <p className="mt-2 text-ink-muted">
          You'll be charged <strong className="font-semibold text-ink">{formatPrice(totalCents)}</strong> on {formatShortDate(nextChargeAt)} for{" "}
          {itemCount} items.
        </p>
        <Button onClick={onSkip} className="mt-5 w-full sm:w-auto">
          Skip this delivery
        </Button>
      </section>
    );
  }

  if (status === "paused") {
    return (
      <section aria-labelledby={headingId} className={cardClass}>
        <h2 id={headingId} className="font-display text-2xl font-semibold text-ink">
          Your deliveries are paused
        </h2>
        <p className="mt-2 text-ink-muted">
          {pausedUntil ? `They resume on ${formatWeekdayDate(pausedUntil)}. ` : ""}You won't be charged until then.
        </p>
        <Button onClick={onResume} className="mt-5 w-full sm:w-auto">
          Resume now
        </Button>
      </section>
    );
  }

  return (
    <section aria-labelledby={headingId} className={cardClass}>
      <h2 id={headingId} className="font-display text-2xl font-semibold text-ink">
        Your subscription is cancelled
      </h2>
      <p className="mt-2 text-ink-muted">
        {cancelledAt ? `You cancelled ${formatWhen(cancelledAt)}. ` : ""}You won't be charged again.
      </p>
      <Button variant="primary" onClick={onRestart} className="mt-5 w-full sm:w-auto">
        Restart subscription
      </Button>
    </section>
  );
}
