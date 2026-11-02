import { useId, useRef } from "react";
import { formatShortDate } from "../lib/dates";
import { formatPrice } from "../lib/money";
import { Button } from "./Button";
import { SUPPORT_EMAIL } from "./content";
import { Dialog } from "./Dialog";
import { dateAfterSkip } from "./summary";

/** confirm: asking. pending: request in flight. conflict: changed elsewhere, showing fresh data. */
export type SkipStatus = "confirm" | "pending" | "conflict" | "repeated-conflict" | "error";

interface SkipDialogProps {
  open: boolean;
  status: SkipStatus;
  nextChargeAt: string;
  intervalDays: number;
  totalCents: number;
  onConfirm: () => void;
  onClose: () => void;
}

export function SkipDialog({ open, status, nextChargeAt, intervalDays, totalCents, onConfirm, onClose }: SkipDialogProps) {
  const titleId = useId();
  const keepRef = useRef<HTMLButtonElement>(null);
  const date = formatShortDate(nextChargeAt);
  const conflict = status === "conflict" || status === "repeated-conflict";
  // While the skip is in flight the dialog stays open, so it can't look cancelled while it goes through.
  const pending = status === "pending";

  return (
    <Dialog open={open} onClose={onClose} titleId={titleId} initialFocus={keepRef} dismissible={!pending}>
      <h2 id={titleId} className="font-display text-2xl font-semibold text-ink">
        Skip your {date} delivery?
      </h2>
      {conflict && (
        <p role="alert" className="mt-3 rounded-option bg-badge p-3 text-sm text-ink">
          Your subscription changed since you opened this page, so we didn't skip anything. These are the latest details.
          {status === "repeated-conflict" && (
            <>
              {" "}
              If this keeps happening, email us at{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium whitespace-nowrap underline underline-offset-2">
                {SUPPORT_EMAIL}
              </a>
              .
            </>
          )}
        </p>
      )}
      {status === "error" && (
        <p role="alert" className="mt-3 rounded-option bg-badge p-3 text-sm text-ink">
          We couldn't skip your delivery. Nothing changed. Please try again.
        </p>
      )}
      <p className="mt-3 text-ink-muted">
        You won't be charged {formatPrice(totalCents)} on {date}. Your next delivery will be {formatShortDate(dateAfterSkip(nextChargeAt, intervalDays))}.
      </p>
      {/* Stacked on phones with the action on top; the buttons never share a position with the page's
          Skip button, so a double tap can't confirm by accident. */}
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button ref={keepRef} unavailable={pending} onClick={onClose}>
          Keep it
        </Button>
        <Button variant="primary" busy={pending} onClick={onConfirm}>
          {pending ? "Skipping..." : status === "error" ? "Try again" : `Skip ${date} delivery`}
        </Button>
      </div>
    </Dialog>
  );
}
