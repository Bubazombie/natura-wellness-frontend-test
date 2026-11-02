import { useId } from "react";
import { formatPrice } from "../lib/money";
import { copy } from "./copy";
import { CheckIcon, ChevronDownIcon } from "./icons";
import { OptionCard } from "./OptionCard";
import type { PurchaseOption } from "./pricing";

interface PurchaseOptionsProps {
  option: PurchaseOption;
  onOptionChange: (option: PurchaseOption) => void;
  frequency: string;
  onFrequencyChange: (frequency: string) => void;
}

const priceClass = "block text-lg leading-6.5 font-semibold";

export function PurchaseOptions({ option, onOptionChange, frequency, onFrequencyChange }: PurchaseOptionsProps) {
  const name = useId();
  const frequencyId = useId();

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="sr-only">Purchase option</legend>
      <OptionCard
        name={name}
        value="one-time"
        checked={option === "one-time"}
        onSelect={onOptionChange}
        label={<span className="font-semibold">{copy.oneTime.label}</span>}
        price={<span className={priceClass}>{formatPrice(copy.oneTime.priceCents)}</span>}
      />
      <OptionCard
        name={name}
        value="subscribe"
        checked={option === "subscribe"}
        onSelect={onOptionChange}
        label={
          <>
            <span className="font-semibold">{copy.subscribe.label}</span>
            <span className="rounded-full bg-badge px-2.5 py-0.5 text-micro leading-4 font-bold tracking-caps text-badge-ink uppercase">
              {copy.subscribe.badge}
            </span>
          </>
        }
        price={
          <>
            <span className={priceClass}>{formatPrice(copy.subscribe.priceCents)}</span>
            <s className="block text-caption leading-3.5 text-ink-subtle">
              <span className="sr-only">Regular price </span>
              {formatPrice(copy.subscribe.comparePriceCents)}
            </s>
          </>
        }
        details={
          <div className="pr-5 pb-4 pl-13">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <label htmlFor={frequencyId} className="text-sm whitespace-nowrap text-ink-muted">
                {copy.subscribe.frequencyLabel}
              </label>
              <div className="relative">
                <select
                  id={frequencyId}
                  value={frequency}
                  onChange={(event) => {
                    onFrequencyChange(event.target.value);
                  }}
                  className="h-11 cursor-pointer lg:h-8.25 appearance-none rounded-lg border border-line-control bg-surface pr-12 pl-3 text-sm"
                >
                  {copy.subscribe.frequencyOptions.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-muted" />
              </div>
            </div>
            <ul className="mt-3 flex flex-col gap-1.25 text-sm leading-5">
              {copy.subscribe.perks.map((perk) => (
                <li key={perk} className="flex items-center gap-2.5">
                  <CheckIcon className="size-3.5 text-brand" />
                  {perk}
                </li>
              ))}
            </ul>
          </div>
        }
      />
    </fieldset>
  );
}
