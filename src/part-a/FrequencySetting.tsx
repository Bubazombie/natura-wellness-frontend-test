import { useId } from "react";
import { ChevronDownIcon } from "../ui/icons";
import { FREQUENCY_OPTIONS_DAYS, frequencyLabel } from "./content";

interface FrequencySettingProps {
  intervalDays: number;
  onChange: (days: number) => void;
}

export function FrequencySetting({ intervalDays, onChange }: FrequencySettingProps) {
  const id = useId();
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <label htmlFor={id} className="font-medium">
        Delivery frequency
      </label>
      <div className="relative">
        <select
          id={id}
          value={intervalDays}
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
  );
}
