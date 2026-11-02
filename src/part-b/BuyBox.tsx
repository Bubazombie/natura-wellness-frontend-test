import { useId, useState } from "react";
import { formatPrice } from "../lib/money";
import { copy } from "./copy";
import { buildFinePrint } from "./finePrint";
import { CheckCircleIcon } from "./icons";
import { orderTotalCents, type PurchaseOption } from "./pricing";
import { ProductSummary } from "./ProductSummary";
import { PurchaseOptions } from "./PurchaseOptions";
import { QuantityStepper } from "./QuantityStepper";

export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 10;

const prices = { oneTimeCents: copy.oneTime.priceCents, subscribeCents: copy.subscribe.priceCents };

export function BuyBox() {
  const titleId = useId();
  const [option, setOption] = useState<PurchaseOption>("subscribe");
  const [frequency, setFrequency] = useState(copy.subscribe.frequencyOptions[0]);
  const [quantity, setQuantity] = useState(MIN_QUANTITY);
  const totalCents = orderTotalCents(option, quantity, prices);

  return (
    <div className="px-4 py-8 md:px-6 md:py-10 lg:px-8 lg:py-14 wide:px-16">
      {/* The photo card never grows past its 540px in the reference:
          - below md, one column capped at 540px (full width on phones)
          - md to lg, two equal columns, as on tablets and small or scaled laptops
          - from lg, the reference's 15:13 columns (540px photo to 468px details); the box is capped
            at 540 * 28/15 + gap, which is 1048px with lg's 40px gap and 1072px with wide's 64px gap */}
      <section
        aria-labelledby={titleId}
        className="mx-auto grid max-w-135 gap-8 md:max-w-none md:grid-cols-2 md:gap-6 lg:max-w-262 lg:grid-cols-[15fr_13fr] lg:gap-10 wide:max-w-268 wide:gap-16"
      >
        {/* The photo sits 20px inside the card edge in the reference: 19px padding plus the 1px border. */}
        <div className="self-start overflow-hidden rounded-card border border-line bg-surface p-4.75">
          <img src="/product.jpg" alt="Vitamin D bottle, 60 softgels" width={1024} height={1024} className="aspect-square w-full object-cover" />
        </div>
        <div>
          <ProductSummary
            titleId={titleId}
            eyebrow={copy.eyebrow}
            rating={copy.rating}
            reviewCount={copy.reviewCount}
            title={copy.title}
            subtitle={copy.subtitle}
          />
          <hr className="mt-6.75 mb-6 border-line" />
          <PurchaseOptions option={option} onOptionChange={setOption} frequency={frequency} onFrequencyChange={setFrequency} />
          {/* min-w-max keeps the button at least as wide as its label for any total, so when the label
              can't fit beside the stepper the button wraps to its own row instead of overflowing. */}
          <div className="mt-6 flex flex-wrap gap-3">
            <QuantityStepper value={quantity} min={MIN_QUANTITY} max={MAX_QUANTITY} onChange={setQuantity} />
            <button type="button" className="h-14 min-w-max flex-1 cursor-pointer rounded-option bg-brand px-4 font-medium whitespace-nowrap text-surface">
              {/* Real spaces around the hidden dot, so the accessible name reads "Add to cart $25.46". */}
              {copy.addToCart}{" "}
              <span aria-hidden="true" className="mx-2">
                ·
              </span>{" "}
              {formatPrice(totalCents)}
            </button>
          </div>
          <ul className="mt-4.5 flex flex-wrap gap-x-6 gap-y-2 text-caption font-medium text-ink-muted">
            {copy.trust.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircleIcon className="size-3.5 text-brand" />
                {item}
              </li>
            ))}
          </ul>
          {option === "subscribe" && <p className="mt-3.5 text-xs leading-normal text-ink-subtle">{buildFinePrint(frequency, totalCents)}</p>}
        </div>
      </section>
    </div>
  );
}
