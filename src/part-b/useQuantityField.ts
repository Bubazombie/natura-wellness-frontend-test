import { useState } from "react";
import { clampQuantity, resolveQuantity, validQuantity, type QuantityRange } from "./quantity";

export interface QuantityField {
  /** Always a valid quantity: what totals and the fine print use. */
  value: number;
  /** What the field shows: the text being typed, or the value. */
  text: string;
  invalid: boolean;
  /** Set after an entry was corrected; cleared by the next valid change. */
  message: string | null;
  range: QuantityRange;
  type: (text: string) => void;
  commit: () => void;
  step: (delta: number) => void;
  set: (value: number) => void;
}

export function useQuantityField(range: QuantityRange): QuantityField {
  const [value, setValue] = useState(range.min);
  const [draft, setDraft] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const set = (next: number) => {
    setValue(clampQuantity(next, range));
    setDraft(null);
    setMessage(null);
  };

  return {
    value,
    text: draft ?? String(value),
    invalid: draft !== null && validQuantity(draft, range) === null,
    message,
    range,
    type: (text) => {
      setDraft(text);
      const typed = validQuantity(text, range);
      if (typed !== null) {
        setValue(typed);
        setMessage(null);
      }
    },
    commit: () => {
      if (draft === null) return;
      const resolved = resolveQuantity(draft, value, range);
      setValue(resolved.value);
      setDraft(null);
      setMessage(resolved.message);
    },
    step: (delta) => {
      set(value + delta);
    },
    set,
  };
}
