import { useId, useRef, useState } from "react";
import { totalAfterDiscount } from "../api/fixtures";
import type { CatalogProduct, Subscription } from "../api/types";
import { formatShortDate } from "../lib/dates";
import { formatPrice } from "../lib/money";
import { CloseIcon } from "../ui/icons";
import { Button } from "./Button";
import { BUNDLE_CONTENTS, CANCEL_REASONS, type CancelReason } from "./content";
import { Dialog } from "./Dialog";
import { OfferOption } from "./OfferOption";
import { PauseOptions } from "./PauseOptions";
import { dateAfterSkip } from "./summary";
import { swapOptions, type SwapOption } from "./swaps";

export interface CancelFlowActions {
  onSkip: () => void;
  onFrequencyChange: (days: number) => void;
  onQuantityChange: (sku: string, quantity: number) => void;
  onSwap: (fromSku: string, to: CatalogProduct) => void;
  onPause: (months: number) => void;
  onCancelSubscription: (reason: CancelReason | null) => void;
}

interface CancelFlowProps extends CancelFlowActions {
  open: boolean;
  subscription: Subscription;
  catalog: CatalogProduct[];
  onClose: () => void;
}

const LONGER_INTERVALS_DAYS = [60, 90];

type OfferKind = "slow-down" | "spend-less" | "swap" | "pause";

const offerTitle: Record<OfferKind, string> = {
  "slow-down": "Have too much on hand?",
  "spend-less": "Want to spend less?",
  swap: "Try something else of ours?",
  pause: "Want to take a break instead?",
};

/** The one offer for a reason. A swap needs something to swap to; without one, a pause is offered. */
function offerKind(reason: CancelReason, canSwap: boolean): OfferKind {
  if (reason === "too-much-product") return "slow-down";
  if (reason === "too-expensive") return "spend-less";
  if (reason === "different-product" && canSwap) return "swap";
  return "pause";
}

/**
 * Asks why, then offers the one alternative that fits the reason. "Cancel subscription" is on every
 * step, the reason is optional, and closing the dialog keeps the subscription as it is.
 */
export function CancelFlow({ open, subscription, catalog, onClose, ...actions }: CancelFlowProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [reason, setReason] = useState<CancelReason | null>(null);
  const [step, setStep] = useState<"reason" | "offer">("reason");
  const swaps = swapOptions(subscription.items, catalog, BUNDLE_CONTENTS);
  const offer = step === "offer" && reason ? offerKind(reason, swaps.length > 0) : null;

  const close = () => {
    setStep("reason");
    setReason(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={close} titleId={titleId} initialFocus={closeRef}>
      <div className="flex items-start justify-between gap-4">
        <h2 id={titleId} className="font-display text-2xl font-semibold text-ink">
          {offer ? offerTitle[offer] : "Before you go"}
        </h2>
        <button
          ref={closeRef}
          type="button"
          aria-label="Close and keep my subscription"
          onClick={close}
          className="-mt-2 inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink-muted hover:bg-surface-selected"
        >
          <CloseIcon className="size-5" />
        </button>
      </div>

      {offer ? (
        <Offer kind={offer} subscription={subscription} swaps={swaps} {...actions} />
      ) : (
        <ReasonStep reason={reason} onReasonChange={setReason} />
      )}

      <div className="mt-6 flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="quiet"
          onClick={() => {
            actions.onCancelSubscription(reason);
          }}
        >
          Cancel subscription
        </Button>
        {offer ? (
          <Button
            onClick={() => {
              setStep("reason");
            }}
          >
            Back
          </Button>
        ) : (
          <Button
            variant="primary"
            unavailable={!reason}
            onClick={() => {
              setStep("offer");
            }}
          >
            Continue
          </Button>
        )}
      </div>
    </Dialog>
  );
}

function ReasonStep({ reason, onReasonChange }: { reason: CancelReason | null; onReasonChange: (reason: CancelReason) => void }) {
  const name = useId();
  return (
    <fieldset className="mt-4">
      <legend className="text-ink-muted">What's the main reason you want to cancel? This is optional.</legend>
      <div className="mt-3 space-y-2">
        {CANCEL_REASONS.map(({ id, label }) => (
          <label
            key={id}
            className="flex min-h-11 cursor-pointer items-center gap-3 rounded-option border border-line-option px-4 has-checked:border-brand has-checked:bg-surface-selected"
          >
            <input
              type="radio"
              name={name}
              value={id}
              checked={reason === id}
              onChange={() => {
                onReasonChange(id);
              }}
              className="size-5 shrink-0 cursor-pointer appearance-none rounded-full border-[1.5px] border-control bg-surface checked:border-2 checked:border-brand checked:bg-brand checked:shadow-[inset_0_0_0_3px_var(--color-surface)]"
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** "Multivitamin, 30 tablets" becomes "Multivitamin", for use inside sentences. */
function shortName(name: string): string {
  return name.split(",")[0] ?? name;
}

interface OfferProps extends CancelFlowActions {
  kind: OfferKind;
  subscription: Subscription;
  swaps: SwapOption[];
}

function Offer({ kind, subscription, swaps, ...actions }: OfferProps) {
  const { items, discountPercent, nextChargeAt, intervalDays } = subscription;
  const optionsClass = "mt-5 flex flex-col gap-2";

  if (kind === "slow-down") {
    return (
      <>
        <p className="mt-3 text-ink-muted">You don't have to cancel to slow down.</p>
        <div className={optionsClass}>
          {nextChargeAt && (
            <OfferOption
              primary
              label={`Skip the ${formatShortDate(nextChargeAt)} delivery`}
              detail={`Your next delivery would be ${formatShortDate(dateAfterSkip(nextChargeAt, intervalDays))}`}
              onChoose={actions.onSkip}
            />
          )}
          {LONGER_INTERVALS_DAYS.filter((days) => days !== intervalDays).map((days) => (
            <OfferOption
              key={days}
              label={`Deliver every ${String(days)} days`}
              detail="Same items and price, less often"
              onChoose={() => {
                actions.onFrequencyChange(days);
              }}
            />
          ))}
        </div>
      </>
    );
  }

  if (kind === "spend-less") {
    const reducible = items.filter((item) => item.quantity > 1);
    return (
      <>
        <p className="mt-3 text-ink-muted">You're already saving {discountPercent}%. You can also get less, or get it less often.</p>
        <div className={optionsClass}>
          {reducible.map((item) => {
            const fewer = items.map((i) => (i.sku === item.sku ? { ...i, quantity: i.quantity - 1 } : i));
            return (
              <OfferOption
                key={item.sku}
                label={`Get ${String(item.quantity - 1)} ${shortName(item.name)} instead of ${String(item.quantity)}`}
                detail={`${formatPrice(totalAfterDiscount(fewer, discountPercent))} per delivery`}
                onChoose={() => {
                  actions.onQuantityChange(item.sku, item.quantity - 1);
                }}
              />
            );
          })}
          <OfferOption
            label={`Deliver every ${String(intervalDays * 2)} days`}
            detail="Half as often, same price per delivery"
            onChoose={() => {
              actions.onFrequencyChange(intervalDays * 2);
            }}
          />
        </div>
      </>
    );
  }

  if (kind === "swap") {
    // One tap per swap, each naming both products: with only a few combinations, that is clearer and
    // faster than first asking which product to replace.
    return (
      <>
        <p className="mt-3 text-ink-muted">Swap one of your products for something else in your next delivery.</p>
        <div className={optionsClass}>
          {swaps.map(({ from, to }) => (
            <OfferOption
              key={`${from.sku}-${to.sku}`}
              label={`Swap ${shortName(from.name)} for ${shortName(to.name)}`}
              detail={`${to.name} · ${formatPrice(to.unitPriceCents)} before your ${String(discountPercent)}% saving`}
              onChoose={() => {
                actions.onSwap(from.sku, to);
              }}
            />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <p className="mt-3 text-ink-muted">Pause your deliveries and pick up again when you're ready. You won't be charged while paused.</p>
      <div className="mt-5">
        <PauseOptions onPause={actions.onPause} />
      </div>
    </>
  );
}
