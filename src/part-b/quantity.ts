export interface QuantityRange {
  min: number;
  max: number;
}

export interface ResolvedQuantity {
  value: number;
  /** Shown after an entry had to be corrected; null when the entry was valid. */
  message: string | null;
}

/** The whole number the text spells, or null for empty text, decimals, signs or letters. */
export function parseWholeNumber(text: string): number | null {
  const trimmed = text.trim();
  return /^\d+$/.test(trimmed) ? Number(trimmed) : null;
}

/** The quantity typed so far, if it is already a valid one, so totals can follow the typing. */
export function validQuantity(text: string, { min, max }: QuantityRange): number | null {
  const value = parseWholeNumber(text);
  return value !== null && value >= min && value <= max ? value : null;
}

export function clampQuantity(value: number, { min, max }: QuantityRange): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * What a finished entry (blur or Enter) becomes. Above the maximum it clamps to the maximum; below
 * the minimum it clamps to the minimum; anything that isn't a whole number keeps the current value.
 */
export function resolveQuantity(text: string, current: number, range: QuantityRange): ResolvedQuantity {
  const value = parseWholeNumber(text);
  if (value !== null && value >= range.min && value <= range.max) return { value, message: null };
  if (value !== null && value > range.max) return { value: range.max, message: `You can order up to ${String(range.max)} at a time.` };

  const rangeMessage = `Enter a quantity from ${String(range.min)} to ${String(range.max)}.`;
  return { value: value === null ? current : range.min, message: rangeMessage };
}
