import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "quiet";

const variants: Record<Variant, string> = {
  primary: "bg-brand px-5 text-surface",
  secondary: "border border-line-control bg-surface px-5 text-ink",
  // For low-emphasis actions such as cancel: visible and findable, but not competing for attention.
  quiet: "text-ink-muted underline underline-offset-4",
};

const unavailableLook: Record<Variant, string> = {
  primary: "bg-line px-5 text-ink-muted",
  secondary: "border border-line bg-page px-5 text-ink-muted",
  quiet: "text-ink-muted",
};

interface ButtonProps extends ComponentProps<"button"> {
  variant?: Variant;
  /** A request is in flight. */
  busy?: boolean;
  /** Not available yet, for example until a choice is made. */
  unavailable?: boolean;
}

// Padding lives in each variant rather than being overridden by className, because two padding
// utilities on one element resolve by stylesheet order, not by the order they are written in.
// Busy and unavailable buttons stay focusable and are announced as unavailable (aria-disabled), and
// ignore presses, instead of disappearing from the Tab order like disabled buttons do.
export function Button({ variant = "secondary", busy = false, unavailable = false, className = "", onClick, children, ...rest }: ButtonProps) {
  const inactive = busy || unavailable;
  // Busy keeps its variant's look (the action is happening); unavailable looks muted, so it doesn't
  // read as pressable. The muted text still has nearly 6:1 contrast, though WCAG exempts inactive controls.
  const look = unavailable ? unavailableLook[variant] : variants[variant];
  return (
    <button
      type="button"
      aria-disabled={inactive || undefined}
      onClick={inactive ? undefined : onClick}
      className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-option font-medium ${busy ? "cursor-progress" : unavailable ? "cursor-not-allowed" : "cursor-pointer"} ${look} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
