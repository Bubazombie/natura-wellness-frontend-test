import { useId } from "react";
import { ChevronDownIcon } from "../ui/icons";
import { FREQUENCY_OPTIONS_DAYS, frequencyLabel } from "./content";

interface FrequencySettingProps {
  intervalDays: number;
  onChange: (days: number) => void;
  /** Shown right under the select after it changes, where the customer is looking. */
  confirmation?: string | null;
}

export function FrequencySetting({ intervalDays, onChange, confirmation }: FrequencySettingProps) {
  const id = useId();
  const confirmationId = useId();
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <label htmlFor={id} className="font-medium">
          Delivery frequency
        </label>
        <div className="relative">
          <select
            id={id}
            value={intervalDays}
            aria-describedby={confirmationId}
            onChange={(event) => {
              onChange(Number(event.target.value));
            }}
            className="h-11 cursor-pointer appearance-none rounded-lg border border-line-control bg-surface pr-10 pl-3"
          >
            {FREQUENCY_OPTIONS_DAYS.map((days) => (
              <option key={days} value={days}>
                {frequencyLabel(days)}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-muted" />
        </div>
      </div>
      {/* Always rendered, so the confirmation is announced when it appears; empty, it takes no space. */}
      <p id={confirmationId} role="status" className="mt-2 text-sm text-brand empty:mt-0">
        {confirmation}
      </p>
    </div>
  );
}
