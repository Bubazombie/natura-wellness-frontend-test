// .example is reserved for documentation (RFC 2606), so this can't be mistaken for a real address.
export const SUPPORT_EMAIL = "help@natura-wellness.example";

export const FREQUENCY_OPTIONS_DAYS = [30, 60, 90] as const;
export const PAUSE_OPTIONS_MONTHS = [1, 2, 3] as const;

export type CancelReason = "too-much-product" | "too-expensive" | "different-product" | "no-results" | "other";

export const CANCEL_REASONS: { id: CancelReason; label: string }[] = [
  { id: "too-much-product", label: "I have too much product left" },
  { id: "too-expensive", label: "It costs too much" },
  { id: "different-product", label: "I'm trying a different product" },
  { id: "no-results", label: "I didn't see results" },
  { id: "other", label: "Something else" },
];

// The catalog has no field for what a bundle contains, so it is recorded here rather than parsed
// from the product name.
export const BUNDLE_CONTENTS: Record<string, readonly string[]> = {
  "NW-ESSENTIALS": ["NW-VITD-60", "NW-MULTI-30", "NW-MAG-90"],
};

export function frequencyLabel(days: number): string {
  return `Every ${String(days)} days`;
}
