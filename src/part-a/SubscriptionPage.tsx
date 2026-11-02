import { useId, type ReactNode } from "react";
import type { Subscription } from "../api/types";
import { Button } from "./Button";
import { FrequencySetting } from "./FrequencySetting";
import { ItemList } from "./ItemList";
import { Notice } from "./Notice";
import { PageHeader } from "./PageHeader";
import { PriceSummary } from "./PriceSummary";
import { StatusSummary } from "./StatusSummary";
import { priceSummary } from "./summary";

export interface SubscriptionActions {
  onSkip: () => void;
  onResume: () => void;
  onRestart: () => void;
  onFrequencyChange: (days: number) => void;
  onPause: () => void;
  onCancel: () => void;
}

interface SubscriptionPageProps extends SubscriptionActions {
  subscription: Subscription;
  /** A confirmation of the last change, such as a skip or a cancellation. */
  notice?: ReactNode;
}

const card = "rounded-card border border-line-option bg-surface p-5 sm:p-6";
const sectionTitle = "font-display text-xl font-semibold text-ink";
const itemsTitle = { active: "In your next delivery", paused: "In your subscription", cancelled: "What you had" } as const;

/** The page for one subscription, in the order customers need it: what's next, what's in it, settings. */
export function SubscriptionPage({ subscription, notice, ...actions }: SubscriptionPageProps) {
  const itemsId = useId();
  const manageId = useId();
  const { status } = subscription;

  return (
    <div>
      <PageHeader status={status} />
      <Notice>{notice}</Notice>

      <div className="mt-6 space-y-6">
        <StatusSummary subscription={subscription} onSkip={actions.onSkip} onResume={actions.onResume} onRestart={actions.onRestart} />

        <section aria-labelledby={itemsId} className={card}>
          <h2 id={itemsId} className={`${sectionTitle} mb-4`}>
            {itemsTitle[status]}
          </h2>
          <ItemList items={subscription.items} />
          <PriceSummary summary={priceSummary(subscription)} discountPercent={subscription.discountPercent} />
        </section>

        {status !== "cancelled" && (
          <section aria-labelledby={manageId} className={`${card} space-y-5`}>
            <h2 id={manageId} className={sectionTitle}>
              Manage your subscription
            </h2>
            <FrequencySetting intervalDays={subscription.intervalDays} onChange={actions.onFrequencyChange} />
            <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-4">
              {status === "active" && (
                <Button variant="quiet" onClick={actions.onPause}>
                  Pause deliveries
                </Button>
              )}
              <Button variant="quiet" onClick={actions.onCancel}>
                Cancel subscription
              </Button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
