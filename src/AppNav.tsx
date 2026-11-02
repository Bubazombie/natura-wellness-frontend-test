export type Part = "a" | "b";

const links: { part: Part; href: string; label: string; detail: string }[] = [
  { part: "a", href: "?part=a&fixture=active", label: "Part A", detail: "Subscription page" },
  { part: "b", href: "?part=b", label: "Part B", detail: "Buy box" },
];

interface AppNavProps {
  current: Part;
}

/** Switches between the two parts of the test. Gutters match the Part B layout so edges line up. */
export function AppNav({ current }: AppNavProps) {
  return (
    <header className="border-b border-line px-4 md:px-6 lg:px-8 wide:px-16">
      <div className="mx-auto flex max-w-268 flex-wrap items-center justify-between gap-x-4 py-2 sm:gap-x-6">
        <p className="font-display text-base font-semibold text-brand sm:text-lg">Natura Wellness</p>
        <nav aria-label="Test parts">
          <ul className="flex gap-2">
            {links.map(({ part, href, label, detail }) => (
              <li key={part}>
                {/* Phones show only "Part A". The aria-label keeps the full name at every width and starts
                    with the visible text, as WCAG 2.5.3 (Label in Name) asks. */}
                <a
                  href={href}
                  aria-label={`${label}: ${detail}`}
                  aria-current={part === current ? "page" : undefined}
                  className="inline-flex h-11 items-center rounded-full px-3 text-sm font-medium whitespace-nowrap text-ink-muted hover:bg-surface-selected aria-[current=page]:bg-brand aria-[current=page]:text-surface sm:px-4"
                >
                  {label}
                  <span className="max-sm:hidden">: {detail}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
