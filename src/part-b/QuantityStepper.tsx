import { useId } from "react";
import { MinusIcon, PlusIcon } from "./icons";

interface QuantityStepperProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

const buttonClass =
  "flex w-11 shrink-0 cursor-pointer items-center justify-center text-ink-muted disabled:cursor-not-allowed disabled:opacity-40";

export function QuantityStepper({ value, min, max, onChange }: QuantityStepperProps) {
  const inputId = useId();

  return (
    <div className="flex h-14 w-32 shrink-0 rounded-option border border-line-control bg-surface">
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={value <= min}
        onClick={() => {
          onChange(value - 1);
        }}
        className={buttonClass}
      >
        <MinusIcon className="size-4" />
      </button>
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
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={value >= max}
        onClick={() => {
          onChange(value + 1);
        }}
        className={buttonClass}
      >
        <PlusIcon className="size-4" />
      </button>
    </div>
  );
}
