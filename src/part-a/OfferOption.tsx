interface OfferOptionProps {
  label: string;
  detail: string;
  primary?: boolean;
  onChoose: () => void;
}

// Its own button rather than a restyled <Button>: the layout (stacked, left-aligned) differs, and
// overriding Button's alignment utilities would depend on stylesheet order.
/** One alternative in the cancel flow: a short action, with what it means underneath. */
export function OfferOption({ label, detail, primary = false, onChoose }: OfferOptionProps) {
  return (
    <button
      type="button"
      onClick={onChoose}
      className={`flex min-h-11 w-full cursor-pointer flex-col items-start rounded-option px-5 py-3 text-left font-medium ${
        primary ? "bg-brand text-surface" : "border border-line-control bg-surface text-ink"
      }`}
    >
      <span>{label}</span>
      <span className={`text-sm font-normal ${primary ? "text-surface/85" : "text-ink-muted"}`}>{detail}</span>
    </button>
  );
}
