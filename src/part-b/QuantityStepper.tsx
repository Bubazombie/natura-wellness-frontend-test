import { useId, type ReactNode } from "react";
import { MinusIcon, PlusIcon } from "./icons";

interface QuantityStepperProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
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

export function QuantityStepper({ value, min, max, onChange }: QuantityStepperProps) {
  const inputId = useId();

  return (
    <div className="flex h-14 w-32 shrink-0 rounded-option border border-line-control bg-surface">
      <StepButton
        label="Decrease quantity"
        unavailable={value <= min}
        onPress={() => {
          onChange(value - 1);
        }}
      >
        <MinusIcon className="size-4" />
      </StepButton>
      <label htmlFor={inputId} className="sr-only">
        Quantity
      </label>
      <input
        id={inputId}
        inputMode="numeric"
        value={value}
        readOnly
        className="w-full min-w-0 bg-transparent text-center font-medium"
      />
      <StepButton
        label="Increase quantity"
        unavailable={value >= max}
        onPress={() => {
          onChange(value + 1);
        }}
      >
        <PlusIcon className="size-4" />
      </StepButton>
    </div>
  );
}
