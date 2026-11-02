// Dates are shown in the customer's own timezone, in US English to match the store's currency.
const LOCALE = "en-US";

const weekdayDate = new Intl.DateTimeFormat(LOCALE, { weekday: "long", month: "long", day: "numeric" });
const shortDate = new Intl.DateTimeFormat(LOCALE, { month: "short", day: "numeric" });
const fullDate = new Intl.DateTimeFormat(LOCALE, { month: "long", day: "numeric", year: "numeric" });

/** "Sunday, November 8": the headline date of the next delivery. */
export function formatWeekdayDate(iso: string): string {
  return weekdayDate.format(new Date(iso));
}

/** "Nov 8": compact, for sentences and button labels. */
export function formatShortDate(iso: string): string {
  return shortDate.format(new Date(iso));
}

/** "October 23, 2026": for past events, where the year can matter. */
export function formatFullDate(iso: string): string {
  return fullDate.format(new Date(iso));
}

/** "today" for an event earlier today in the customer's timezone, otherwise "on October 23, 2026". */
export function formatWhen(iso: string, now: Date = new Date()): string {
  return new Date(iso).toDateString() === now.toDateString() ? "today" : `on ${formatFullDate(iso)}`;
}
