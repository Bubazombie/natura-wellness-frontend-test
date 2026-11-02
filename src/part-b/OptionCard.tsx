import type { ReactNode } from "react";

interface OptionCardProps<T extends string> {
  name: string;
  value: T;
  checked: boolean;
  onSelect: (value: T) => void;
  label: ReactNode;
  price: ReactNode;
  /** Shown below the label row while the option is selected. Kept outside the label, because a
   *  label must not contain other interactive controls. */
  details?: ReactNode;
}

export function OptionCard<T extends string>({ name, value, checked, onSelect, label, price, details }: OptionCardProps<T>) {
  return (
    <div
      className={
        // The selected state adds an inset ring instead of a thicker border, so nothing shifts.
        checked
          ? "rounded-option border border-brand bg-surface-selected ring-1 ring-brand ring-inset"
          : "rounded-option border border-line-option bg-surface"
      }
    >
      <label className="flex cursor-pointer items-center gap-3 px-5 py-4">
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={() => {
            onSelect(value);
          }}
          className="size-5 shrink-0 cursor-pointer appearance-none rounded-full border-[1.5px] border-control bg-surface checked:border-2 checked:border-brand checked:bg-brand checked:shadow-[inset_0_0_0_3px_var(--color-surface)]"
        />
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">{label}</span>
        <span className="text-right">{price}</span>
      </label>
      {checked && details}
    </div>
  );
}
