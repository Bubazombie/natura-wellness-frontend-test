import type { ReactNode } from "react";
import { radioInputClass } from "../ui/styles";

interface OptionCardProps<T extends string> {
  name: string;
  value: T;
  checked: boolean;
  onSelect: (value: T) => void;
  label: ReactNode;
  price: ReactNode;
  /** Expanded below the label row while the option is selected. Kept outside the label, because a
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
          className={radioInputClass}
        />
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">{label}</span>
        <span className="text-right">{price}</span>
      </label>
      {details && (
        // Collapses by animating grid rows from 0fr to 1fr, which works in every current browser (unlike
        // animating to height: auto). Collapsed content is inert at once (out of the Tab order and the
        // accessibility tree) and becomes visibility: hidden once the animation ends, so it is truly
        // hidden rather than only clipped. The inner 4px top padding keeps the select's focus ring inside the clip,
        // and the -4px margin while expanded cancels it out, so the reference spacing holds.
        <div
          inert={!checked}
          className={`grid transition-[grid-template-rows,margin] duration-200 ease-out motion-reduce:transition-none ${checked ? "-mt-1 grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
        >
          <div className={`overflow-hidden pt-1 transition-[visibility] duration-200 motion-reduce:transition-none ${checked ? "" : "invisible"}`}>
            {details}
          </div>
        </div>
      )}
    </div>
  );
}
