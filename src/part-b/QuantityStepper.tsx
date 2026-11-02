import { useId, type KeyboardEvent, type ReactNode } from "react";
import { MinusIcon, PlusIcon } from "./icons";
import type { QuantityField } from "./useQuantityField";

interface QuantityStepperProps {
  field: QuantityField;
  /** Id of the element that shows the field's correction message. */
  describedBy: string;
}

interface StepButtonProps {
  label: string;
  unavailable: boolean;
  onPress: () => void;
  children: ReactNode;
}

// aria-disabled instead of disabled: the button stays in the Tab order and is announced as
// unavailable, and it keeps the reference's look at the limits. Pressing it then does nothing.
function StepButton({ label, unavailable, onPress, children }: StepButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-disabled={unavailable}
      onClick={() => {
        if (!unavailable) onPress();
      }}
      className="flex w-11 shrink-0 cursor-pointer items-center justify-center text-ink-muted aria-disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

/** A spinbutton (WAI-ARIA APG): type a number, use the buttons, or Up/Down, Home/End and Enter. */
export function QuantityStepper({ field, describedBy }: QuantityStepperProps) {
  const inputId = useId();
  const { min, max } = field.range;

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const actions: Record<string, (() => void) | undefined> = {
      ArrowUp: () => {
        field.step(1);
      },
      ArrowDown: () => {
        field.step(-1);
      },
      Home: () => {
        field.set(min);
      },
      End: () => {
        field.set(max);
      },
      Enter: field.commit,
    };
    const action = actions[event.key];
    if (action) {
      event.preventDefault();
      action();
    }
  };

  return (
    <div className="flex h-14 w-32 shrink-0 rounded-option border border-line-control bg-surface">
      <StepButton
        label="Decrease quantity"
        unavailable={field.value <= min}
        onPress={() => {
          field.step(-1);
        }}
      >
        <MinusIcon className="size-4" />
      </StepButton>
      <label htmlFor={inputId} className="sr-only">
        Quantity
      </label>
      <input
        id={inputId}
        type="text"
        inputMode="numeric"
        role="spinbutton"
        aria-valuenow={field.value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-invalid={field.invalid}
        aria-describedby={describedBy}
        autoComplete="off"
        value={field.text}
        onChange={(event) => {
          field.type(event.target.value);
        }}
        onBlur={field.commit}
        onKeyDown={onKeyDown}
        className="w-full min-w-0 bg-transparent text-center font-medium"
      />
      <StepButton
        label="Increase quantity"
        unavailable={field.value >= max}
        onPress={() => {
          field.step(1);
        }}
      >
        <PlusIcon className="size-4" />
      </StepButton>
    </div>
  );
}
