import { Button } from "./Button";
import { PAUSE_OPTIONS_MONTHS } from "./content";

const monthsLabel = (months: number) => `${String(months)} ${months === 1 ? "month" : "months"}`;

/** How long to pause for. Used by the pause dialog and by the cancel flow's pause offer. */
export function PauseOptions({ onPause }: { onPause: (months: number) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {PAUSE_OPTIONS_MONTHS.map((months) => (
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
