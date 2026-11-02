import { Button } from "./Button";
import { PAUSE_OPTIONS_MONTHS } from "./content";

const monthsLabel = (months: number) => `${String(months)} ${months === 1 ? "month" : "months"}`;

interface PauseOptionsProps {
  /** Which lengths to offer, in months; all of them unless some don't make sense. */
  options?: readonly number[];
  onPause: (months: number) => void;
}

/** How long to pause for. Used by the pause dialog and by the cancel flow's pause offers. */
export function PauseOptions({ options = PAUSE_OPTIONS_MONTHS, onPause }: PauseOptionsProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {options.map((months) => (
        <Button
          key={months}
          aria-label={`Pause for ${monthsLabel(months)}`}
          onClick={() => {
            onPause(months);
          }}
        >
          {monthsLabel(months)}
        </Button>
      ))}
    </div>
  );
}
