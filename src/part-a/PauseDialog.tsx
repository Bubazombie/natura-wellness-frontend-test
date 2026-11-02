import { useId, useRef } from "react";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { PauseOptions } from "./PauseOptions";

interface PauseDialogProps {
  open: boolean;
  onPause: (months: number) => void;
  onClose: () => void;
}

export function PauseDialog({ open, onPause, onClose }: PauseDialogProps) {
  const titleId = useId();
  const keepRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog open={open} onClose={onClose} titleId={titleId} initialFocus={keepRef}>
      <h2 id={titleId} className="font-display text-2xl font-semibold text-ink">
        Pause your deliveries
      </h2>
      <p className="mt-3 text-ink-muted">Choose how long. You won't be charged while paused, and you can resume at any time.</p>
      <div className="mt-5">
        <PauseOptions onPause={onPause} />
      </div>
      <div className="mt-6 flex justify-end">
        <Button ref={keepRef} variant="quiet" onClick={onClose}>
          Not now
        </Button>
      </div>
    </Dialog>
  );
}
