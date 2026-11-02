import { Button } from "./Button";
import { SUPPORT_EMAIL } from "./content";

const block = "rounded-lg bg-line motion-safe:animate-pulse";

/** A placeholder shaped like the page, so the layout doesn't jump when the data arrives. */
export function LoadingView() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading your subscription</span>
      <div aria-hidden="true" className="space-y-6">
        <div className={`${block} h-9 w-56`} />
        <div className="space-y-3 rounded-card border border-line-option bg-surface p-5 sm:p-6">
          <div className={`${block} h-3 w-28`} />
          <div className={`${block} h-8 w-64 max-w-full`} />
          <div className={`${block} h-4 w-72 max-w-full`} />
          <div className={`${block} mt-2 h-11 w-full sm:w-44`} />
        </div>
        <div className="space-y-4 rounded-card border border-line-option bg-surface p-5 sm:p-6">
          {[0, 1].map((row) => (
            <div key={row} className="flex items-center gap-4">
              <div className={`${block} size-14`} />
              <div className={`${block} h-4 flex-1`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export type LoadFailure = "error" | "not-found";

interface LoadErrorViewProps {
  failure: LoadFailure;
  onRetry: () => void;
}

const failures: Record<LoadFailure, { title: string; body: string; canRetry: boolean }> = {
  error: {
    title: "We couldn't load your subscription",
    body: "Nothing has changed with your subscription. Please try again in a moment.",
    canRetry: true,
  },
  "not-found": {
    title: "We couldn't find a subscription on your account",
    body: "If you think this is a mistake, we can look it up for you.",
    canRetry: false,
  },
};

export function LoadErrorView({ failure, onRetry }: LoadErrorViewProps) {
  const { title, body, canRetry } = failures[failure];
  return (
    <div role="alert" className="rounded-card border border-line-option bg-surface p-5 sm:p-6">
      <h2 className="font-display text-2xl font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-ink-muted">{body}</p>
      {canRetry && (
        <Button variant="primary" onClick={onRetry} className="mt-5 w-full sm:w-auto">
          Try again
        </Button>
      )}
      <p className="mt-5 text-sm text-ink-muted">
        {canRetry ? "Still not working? " : ""}Email us at{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium whitespace-nowrap text-brand underline underline-offset-2">
          {SUPPORT_EMAIL}
        </a>
        .
      </p>
    </div>
  );
}
