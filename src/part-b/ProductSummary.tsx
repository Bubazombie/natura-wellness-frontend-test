import { StarIcon } from "./icons";

const MAX_RATING = 5;

interface ProductSummaryProps {
  titleId: string;
  eyebrow: string;
  rating: string;
  reviewCount: string;
  title: string;
  subtitle: string;
}

export function ProductSummary({ titleId, eyebrow, rating, reviewCount, title, subtitle }: ProductSummaryProps) {
  const filledStars = Math.round(Number(rating));

  return (
    <div>
      <p className="text-caption leading-3.75 font-semibold tracking-caps text-ink-subtle uppercase">{eyebrow}</p>
      <div className="mt-2.75 flex items-center gap-2 text-sm leading-5">
        <span className="flex gap-1">
          {Array.from({ length: MAX_RATING }, (_, i) => (
            <StarIcon key={i} className={i < filledStars ? "size-3.5 text-star" : "size-3.5 text-line-control"} />
          ))}
        </span>
        <span className="font-semibold">
          <span className="sr-only">Rated </span>
          {rating}
          <span className="sr-only"> out of {MAX_RATING}</span>
        </span>
        <a href="#reviews" className="-my-3 py-3 text-ink-subtle underline underline-offset-2 lg:my-0 lg:py-0">
          {reviewCount}
        </a>
      </div>
      <h1 id={titleId} className="mt-2 font-display text-display leading-tight font-semibold text-brand">
        {title}
      </h1>
      <p className="mt-2.25 max-w-md leading-relaxed text-ink-muted">{subtitle}</p>
    </div>
  );
}
