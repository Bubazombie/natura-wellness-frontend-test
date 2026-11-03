# Natura Wellness frontend test

Two builds for the fictional Natura Wellness supplement store; the brief is in `INSTRUCTIONS.md`.

**Live:** https://natura-wellness-frontend-test-gamma.vercel.app/

## What's built

**Part A: Manage my subscription** (`/?part=a&fixture=active`)

- The next delivery at a glance: date, amount and items, with the 15% saving as its own line.
- Skip the next delivery through the API, behind a confirmation that states the consequence. A 409 ("changed elsewhere") loads the latest details and asks again; repeated conflicts offer support.
- Loading, load error, not found, paused and cancelled each have their own state, with a clear next step. Paused and cancelled never offer a skip.
- The retention feature: a cancel flow that asks why and offers one alternative for that reason (skip or deliver less often, lower the cost, swap a product, or pause). Cancelling takes two taps at minimum.
- Changes other than skipping are simulated in local state on top of the server data, as the brief allows.

Test cases: `?fixture=active|paused|cancelled|error` (anything else is "not found"), plus `&conflict=always` or `&conflict=never` to control the 409.

**Part B: Buy box** (`/?part=b`)

- Matches `public/reference/buy-box.png` at 1200px: every row within 1px and 0.98% of pixels different in Chromium on Windows (font rasterization and photo resampling), checked automatically.
- Purchase option, delivery frequency and quantity all work; the prices, the Add to cart total and the renewal fine print stay in step.
- Three layouts from 320px to large desktop, with the photo never larger than in the reference.

## Run it

```
npm install
npm run dev
```

Then open `http://localhost:5173/?part=a&fixture=active` or `http://localhost:5173/?part=b`.

## Test it

```
npx playwright install chromium webkit   # once, for the browser tests
npm run check                            # typecheck, lint, Vitest and Playwright (about 2.5 minutes)
```

- `npm run test`: Vitest. Pure logic runs in Node (`*.test.ts`); components and flows run in real Chromium (`*.test.tsx`), with axe-core checking WCAG 2.2 AA, color contrast included.
- `npm run test:e2e`: Playwright, against a server it starts on port 4174. Desktop and phones (375px and 320px) in Chromium, and iPhone presets in WebKit. It also runs width sweeps from 320 to 1440px and the Part B visual comparison.
- `npx playwright test --project=visual`: only the Part B comparison; `actual.png`, `expected.png` and `diff.png` are saved in `test-results/`.

## Where things live

- `src/api/`: the mock API and fixtures from the brief, unchanged.
- `src/part-a/`: Part A. `SubscriptionCard.tsx` loads the data and holds the state; the rest are presentational components and pure logic (`localChanges.ts`, `swaps.ts`, `summary.ts`, `notices.ts`).
- `src/part-b/`: Part B. `BuyBox.tsx` composes the box; `copy.ts` is the brief's copy, unchanged.
- `src/ui/`, `src/lib/`: icons, and price and date formatting shared by both parts.
- `src/index.css`: design tokens measured from the reference (Tailwind CSS v4 `@theme`).
- `e2e/`: Playwright specs; `e2e/support/` has the width sweep helper.

## Decisions and trade-offs

Each decision lists why we made it and the main alternative we didn't pick.

### Stack

- **Tailwind CSS v4** (via `@tailwindcss/vite`). Design values live as `@theme` tokens in CSS, which suits Part B's exact spacing and colors and gives both parts one shared scale.
  *Not picked:* CSS Modules. No dependency, but more files and no shared token scale.
- **TanStack Query** for loading the subscription and the skip mutation. It handles request dedupe (React StrictMode mounts twice in development), pending and error state, refetching after a 409, and updating the cache from the skip response. Retries are off for mutations and 4xx errors, because retrying a 409 hides a real conflict and the default retries would add seconds to the error state; a load that fails with a 5xx is retried once. Refetching on window focus is off, because nothing else writes to the mock.
  *Not picked:* a hand-written hook with `useReducer`. Fewer dependencies, but we would own every edge case ourselves.
- **Native `<dialog>` with `showModal()`** for confirmations. The browser gives us an inert background, Escape to close, top-layer rendering and focus return. We set initial focus in code because `autofocus` is unreliable in some browsers.
  *Not picked:* Radix Dialog. Similar behavior, but an extra dependency for what the platform already provides.
- **Vitest browser mode** (Playwright provider, Chromium) for component and integration tests; plain Node for pure logic. jsdom doesn't implement `showModal()` and can't check color contrast, so dialog focus and contrast are tested in a real browser.
  *Not picked:* jsdom with React Testing Library. Faster and more familiar, but dialogs would need stubs that don't model focus or modality.
- **axe-core** directly in component tests and **@axe-core/playwright** in end-to-end tests. Both are maintained by Deque and use the same rule engine.
  *Not picked:* vitest-axe. Its last release (0.1.0) was in January 2025, so it looks unmaintained.
- **Playwright** for end-to-end tests at 320px, 375px and desktop, and for the Part B visual check: a screenshot at 1200x780 with deviceScaleFactor 2, compared to `public/reference/buy-box.png` with **pixelmatch**, producing a diff image and a mismatch percentage.
  *Not picked:* judging the match by eye only. It's faster, but it misses small spacing and color differences.
- **ESLint** with typescript-eslint, react-hooks and jsx-a11y. The starter has no linter, and these plugins catch type, hook and accessibility mistakes while coding.
  *Not picked:* no linter, relying on code review only.
- **Mobile end-to-end tests also run in WebKit** (iPhone SE presets at 375px and 320px). Most customers are on phones, many on iPhone, and Safari has its own behavior around `<dialog>` and focus, which the skip confirmation relies on. Desktop runs in Chromium only.
  *Limitation:* Playwright's WebKit is an emulation on a desktop OS, not iOS Safari on a real iPhone, which this project wasn't tested on. Safari's Tab key skips links by default (a user setting turns it on), so the test for the reviews link's focus ring runs only in Chromium; every other keyboard test runs in WebKit too.
  *Not picked:* Chromium-only mobile tests, which would never exercise Safari's engine.
- **The Part B visual check compares only the buy box**, not the full window. The app's nav bar (how reviewers switch parts) stays, and the box's horizontal placement (64px from the left, 1072px wide) is asserted separately. Element-level comparison is the usual recommendation when one component is under test. Text anti-aliasing differs between operating systems, so the check allows a small per-pixel tolerance and a maximum share of differing pixels, and saves our render, the reference crop and a diff image for review.
  *Not picked:* hiding the nav on Part B so the full window matches, which would shape the app around the test.
- **ESLint 9, not 10.** eslint-plugin-jsx-a11y (6.10.2, the latest) supports ESLint up to 9 only.
  *Not picked:* ESLint 10 without jsx-a11y, which loses the accessibility lint rules.
- **The starter's Vite 7 and TypeScript 5.8 stay as they are.** Every tool we added supports them, and upgrading would add changes the brief doesn't need.
  *Not picked:* upgrading to Vite 8 and TypeScript 7.
- **Tests run with the en-US locale and the America/New_York timezone**, set once in `test-env.ts` for Vitest and Playwright. A non-UTC zone with daylight saving time catches code that silently assumes UTC, such as a charge date shifting by a day.
  *Not picked:* UTC, which hides those bugs.
- **End-to-end tests run against the Vite dev server.** It starts in about a second and runs the same code; the production build is still checked by `npm run build`.
  *Not picked:* `vite preview` of the production build. Closer to the deployed site, but every run would need a full build first.
- **`src/api` is excluded from lint.** It is the given contract (see below), so lint errors there aren't something we can act on. Our code is still type-checked against its types.
  *Not picked:* linting it and editing the starter to satisfy the rules.
- **No MSW.** The mock API already runs in the browser, so tests mock the module directly.
  *Not picked:* MSW request mocking, which is useful for real HTTP but adds a layer we don't need here.
- **`src/api/*` and `src/part-b/copy.ts` stay untouched.** They are the given contract, so we adapt to them rather than change them.
  *Not picked:* editing them where convenient, which would make our results harder to compare with the brief.

### Order of work

- **Part B first, then Part A.** Part B is well defined, it proves the tooling and the visual check, and its colors, fonts and radii become the visual language for Part A, which has no design.
  *Not picked:* Part A first. It carries more weight, but we would invent a visual language and then rework it to match the brand.

### App shell

- **A simple branded header with the part switcher**: the "Natura Wellness" wordmark and a labelled `<nav>` of two pill links, the current part in brand green with `aria-current="page"`. Links are 44px tall with 8px between them, so a focused link's ring (2px plus a 2px offset) keeps clear space from the pill beside it, and the gutters match the Part B layout so edges line up. It is the first thing a reviewer sees, so it uses the same tokens as the rest of the app.
  *Not picked:* the starter's unstyled links.
- **On phones the links read "Part A" and "Part B"**, so the header stays on one row down to 320px instead of stacking into three. Each link's `aria-label` keeps the full name ("Part A: Subscription page") at every width, and starts with the visible text, as WCAG 2.5.3 (Label in Name) asks. An end-to-end test checks one row and no sideways scroll from 320 to 1440px.
  *Not picked:* visually hidden text for the rest of the name, which made browsers compute "Part A : Subscription page" with a stray space; or letting the links wrap, which took 137px of a 320px phone screen.

### Part A: subscription page

- **One retention feature: a cancel flow that asks why and offers one alternative for that reason.** Vendor data (Skio) puts reason-based save flows at 15 to 30% of cancellation attempts, against under 5% for a single generic offer. The offers, all simulated in local state except skip:

  | Reason (share of cancellations) | Offer |
  |---|---|
  | Too much product left (38%) | Skip the next delivery first (the one change the API supports), or deliver less often (every 60 or 90 days) |
  | It costs too much (24%) | Lower the cost: fewer units or less frequent delivery, with the new price shown before choosing |
  | Trying a different product (15%) | Swap one product for another from the catalog: one tap per "Swap Multivitamin for Magnesium", so the customer picks which product to replace |
  | Didn't see results (12%), other (11%) | Pause for 1, 2 or 3 months; if already paused, a longer pause, offering only lengths that end later than the current one |

  "Less often" offers only use the frequencies the page itself offers (30, 60 or 90 days), and only longer ones, so an offer can never set a frequency the page can't show.

  Cancelling takes two taps at minimum (Cancel, then Cancel subscription on the first step); giving a reason adds one step, the matching offer, which also has Cancel subscription. The reason is optional and only picks the offer; it isn't stored, because nothing in this build would use it (a real one would send it to analytics). When it is done, the page confirms what happened and offers Restart, with no extra "are you sure?" step. The confirmation is the cancelled card itself ("Your subscription is cancelled. You cancelled today. You won't be charged again."), not a separate notice repeating the same words; when the dialog closes, focus moves to that card's heading, so screen reader users hear it too.
  *Not picked:* a success notice above the cancelled card, which said "Your subscription is cancelled" twice.
  *Not picked:* only a delivery frequency control on the page. Simpler, and the same control is on the page anyway, but it does nothing for the other 62% at the moment they decide to leave.
- **Skipping asks for confirmation in a dialog that states the consequence**: "Skip your Nov 8 delivery?", "You won't be charged $101.87 on Nov 8. Your next delivery will be Dec 8.", with the buttons "Skip Nov 8 delivery" and "Keep it", and focus starting on "Keep it". NN/g recommends confirming only consequential actions, restating the consequence and naming the action on the buttons. The API has no way to undo a skip, which is why this confirms instead of offering undo. While the skip is in flight the dialog can't be closed: "Keep it" is unavailable and Escape is ignored until the result is in, because closing it would look like keeping the delivery while the skip still goes through.
  *Not picked:* an undo toast that sends the skip after a delay, which can lose the skip if the page closes; or a button that turns into "Confirm" in place, where a double tap is exactly the accidental skip the brief wants to prevent.
- **Every state says what happened and what to do next:**

  | State | Shown | Actions |
  |---|---|---|
  | Loading (up to 2.5s) | A placeholder of the page, announced as loading | None |
  | Active | Next delivery date and amount, items, frequency | Skip, change frequency, pause, cancel |
  | Paused | "Paused" badge, resume date, no charge | Resume now, cancel |
  | Cancelled | Cancellation date and what was in it | Restart |
  | Load error (500) | "We couldn't load your subscription. Nothing has changed." | Try again, contact support |
  | Not found (404) | "We couldn't find a subscription on your account." | Contact support |
  | 409 on skip | The dialog updates with the latest details and asks again | Skip or keep it; after two conflicts in a row, contact support |
  | Other skip error | "We couldn't skip your delivery. Nothing changed." in the dialog | Try again |

  The support address is `help@natura-wellness.example`. The `.example` domain is reserved for documentation, so it can't be mistaken for a real address.
  *Not picked:* on a 409, closing the dialog and showing a notice on the page, which makes the customer start the skip again.
- **The swap offer lists each possible swap as one choice naming both products**, rather than first asking which product to replace. With only a few combinations that is faster and clearer (NN/g's progressive disclosure keeps a small set of choices on the first screen). It never offers a product already in the subscription, or a bundle that contains the product being replaced (the bundle's contents are recorded in our own content file, because the catalog has no such field). If nothing is left to swap to, the flow offers a pause instead.
  *Not picked:* a two-step "which product? then which replacement?" flow, which adds a step for no gain at this size; or always swapping the first product, which chose for the customer.
- **At 375px the page leads with the next delivery**: heading and status (the badge always sits under the title on phones, because "Cancelled" doesn't fit beside it and the badge shouldn't move between states), then a card with the date, the amount and the Skip button, then the items, then delivery frequency, then pause and cancel. Customers come to check or change the next delivery; cancel is last but always visible. Item prices are list prices, with the 15% saving as its own line and the server's total, so the lines always add up (rounding each discounted line separately would be off by a cent).
  *Not picked:* leading with the item list, which pushes the date and amount below the fold.
- **Changes other than skipping are simulated as a layer of local changes on top of the server's data**, as the brief allows. A successful skip or a refetch replaces the server data underneath and the local changes still apply, so nothing the customer did disappears. The local changes behave like this:
  - Changing frequency keeps the next delivery's date; the new frequency applies after it.
  - Resume now and Restart deliver tomorrow.
  - Pausing for N months resumes N months from today.
  - Fewer units or a swap recompute the total the same way the server does.

  *Not picked:* writing the simulated changes into the query cache as if the server had returned them, which the next refetch would silently undo.
- **Known limitations of the simulation:**
  - The mock API only knows the 30-day interval. With a different frequency chosen, a real skip still goes to the API (for its real result and conflict handling), but the page shows the date the customer's frequency implies, while the mock moves its date by 30 days. A real API would apply the stored frequency.
  - A subscription resumed or restarted here is still paused or cancelled on the mock server, which would reject a skip, so its skip is simulated too.
- **Setting changes get a visible notice; status changes don't.** Skip, frequency, quantity and swap show a confirmation such as "Done. Your Nov 8 delivery is skipped. Your next delivery is Dec 8." Pause, resume, restart and cancel change the summary card itself: focus moves to its heading (the button that was used is gone, so closing the dialog would otherwise drop focus on the page) and a visually hidden status region reads out what happened, so nothing is said twice on screen.
  *Not picked:* a notice for every change, which repeated the card's own words.
- **A confirmation appears where the customer is looking.** A frequency change made with the select is confirmed right under it, and focus stays on the select. A change made in a dialog moves focus to the notice at the top and scrolls it into view (explicitly, because WebKit focuses without scrolling), so on a phone it is never left off-screen above the button that opened the dialog. While a skip is in flight, a status region announces "Skipping your delivery...", since focus stays on Keep it.
  *Not picked:* one notice at the top for everything, which an independent review found off-screen on a 375px phone after a change near the bottom of the page.
- **A conflict can reveal that the subscription was paused or cancelled elsewhere.** Then the skip dialog closes and the page says so ("...is now paused, so there's no delivery to skip.") instead of asking again about a delivery that no longer exists.
- **Choosing "Skip the Nov 8 delivery" in the cancel flow skips straight away.** That offer already names the delivery and the new date, so asking "Skip your Nov 8 delivery?" again would be a second confirmation of the same choice. The skip dialog still opens to show progress, a conflict or an error.
  *Not picked:* the normal skip confirmation after the offer, one extra tap for no extra safety.
- **Once loaded, the page stays on screen if a later refetch fails**, and only the very first load shows the loading and error views.
- **Buttons that are busy or not available yet use `aria-disabled`, not `disabled`**, like the quantity buttons in Part B: they stay in the Tab order, are announced as unavailable and ignore presses. A button that isn't available yet also looks muted (Continue before a reason is chosen); a busy one keeps its normal look, because its action is happening. Every button is at least 44 by 44px, including the low-emphasis text buttons such as Cancel subscription.
  *Not picked:* the `disabled` attribute, which hides the control from keyboard users while it waits.
- **Dialogs close with a labelled × button ("Close and keep my subscription") where focus starts**, and with Escape. Focus always starts on the choice that changes nothing, and returns to the button that opened the dialog.
  *Not picked:* a text link beside the title, which squeezed the titles into narrow lines on phones.

### Part B: buy box

- **Subscribe is selected by default**, as in the reference.
  *Not picked:* one-time by default, which doesn't match the design.
- **With one-time selected, the subscribe card collapses to its top row** (radio, label, badge, price and compare price) and hides the frequency and perks. The collapse is animated and respects `prefers-reduced-motion`. Shopify's subscription UX guidelines suggest collapsing the unselected option without hiding its name, and this keeps the savings visible.
  *Not picked:* keeping both cards fully expanded, which shows controls that do nothing for the current choice.
- **With one-time selected, the fine print is hidden.** It's an auto-renewal disclosure, and a one-time purchase has nothing to renew.
  *Not picked:* rewording it for one-time purchases, which adds copy the design doesn't have.
- **The fine print reflects quantity and frequency**, for example "renews every 60 days at $50.92" for 2 units, because auto-renewal laws require stating what will actually be charged and how often. The Add to cart button shows the total too, while prices inside the cards stay per unit.
  *Not picked:* a static fine print, which would misstate the charge.
- **Quantity goes from 1 to 10.** Minus is unavailable at 1 and plus at 10. The number in the middle is an editable, labelled input. The maximum of 10 is a product call, not a standard.
  *Not picked:* no maximum, which allows accidental bulk orders.
- **The quantity field is a spin button** (the WAI-ARIA APG pattern): `role="spinbutton"` with its value and range, Up and Down change it by 1, Home and End go to 1 and 10. It stays `type="text"` with `inputmode="numeric"`, as GOV.UK recommends, because `type="number"` changes the value on scroll and silently drops typed letters.
  *Not picked:* `type="number"`; or a plain text box, which screen readers can't announce as an adjustable value.
- **Typed quantities update the total as you type when they are valid, and are corrected when you leave the field.** On blur or Enter, a number above 10 becomes 10 with "You can order up to 10 at a time."; anything else that isn't 1 to 10 (0, empty, letters, decimals) becomes 1 if it was 0, or goes back to the last valid quantity, with "Enter a quantity from 1 to 10." The message sits under the stepper in a polite live region that also describes the field, and clears on the next valid change. While the text is invalid the field has `aria-invalid` and totals keep the last valid quantity.
  *Not picked:* an error that blocks Add to cart until fixed. More explicit, but it adds friction to a field with an obvious correction. Native browser validation bubbles were also ruled out, because their wording and behavior vary by browser.
- **At a limit, the minus or plus button uses `aria-disabled`, not `disabled`.** It stays in the Tab order, screen readers announce it as unavailable, pressing it does nothing, and it keeps the reference's look (the reference shows minus at full strength at quantity 1).
  *Not picked:* the native `disabled` attribute with a dimmed style. Clearer at a glance, but it drops the button from the Tab order, so keyboard and screen reader users can't discover it, and it departs from the reference.
- **The "2,316 reviews" link points to `#reviews`**, the usual anchor for a reviews section. The reviews section itself is out of scope for this test.
  *Not picked:* rendering it as plain text, which loses the expected path to reviews.
- **Three layouts, and the photo never grows past its 540px in the reference:**
  - Below 768px, one column capped at 540px: full width on phones, a centered column on larger phones and small tablets.
  - From 768px, two equal columns with 24px gutters and gap, for tablets and for small or scaled laptops. At 768px that leaves 348px per column, enough to keep Add to cart beside the stepper. A 1280px screen at 150% Windows scaling is about 853px wide and at 125% about 1024px, so these widths are common on desktops, not only on tablets.
  - From 1024px, the reference's 15:13 columns, with the box capped at 1048px (1072px from 1200px, where the gutters and gap become the reference's 64px), so the photo stops at exactly 540px.

  This follows Shopify's Dawn theme, the reference storefront, which puts media and product info side by side from 750px in equal columns and switches to asymmetric columns on desktop.
  *Not picked:* stacking everything below 1024px (our first version). It put common laptop widths into the phone layout and stretched the photo to the full page width.
- **At narrow widths, controls wrap instead of squeezing.** The Add to cart button is never narrower than its label (`min-width: max-content`), so when the label can't fit beside the stepper the button moves to its own full-width row, for any total and any font rendering. The frequency select moves under its label. Below 1024px the select is 44px tall and the reviews link has a 44px tall hit area, our mobile target; at 1200px the select keeps the reference's 33px.
  *Not picked:* a fixed minimum width (our first version). It was tuned to one price in one browser, and between 348 and 364px the button was too narrow for its label but not narrow enough to wrap, so the price overflowed.
- **A width sweep guards the layout.** An end-to-end test resizes the page from 320 to 1440px in 2px steps, in Chromium and WebKit, with the default selection and with the widest totals (quantity 10). It fails on any width where text overflows its box, the page scrolls sideways, or the photo card passes 540px. It caught both layout bugs above before they were fixed.
  *Not picked:* screenshots at a handful of widths, which missed both bugs.
- **The collapse animates `grid-template-rows` from `0fr` to `1fr` over 200ms**, which works in every current browser. Animating to `height: auto` with `interpolate-size` is still Chrome-only, and Safari would skip the transition. Collapsed content stays in the DOM so it can animate, is `inert` at once (out of the Tab order and the accessibility tree) and becomes `visibility: hidden` when the animation ends. With `prefers-reduced-motion` the change is instant.
  *Not picked:* unmounting the content (our first version), which can't animate; or measuring heights in JavaScript, which adds code for what CSS now does.
- **The selected option is drawn with a 1px border plus a 1px inset ring**, so it looks like the reference's 2px border while the content stays exactly where it was. Switching options never shifts the layout.
  *Not picked:* a real 2px border, which moves the content by 1px on every change.
- **Native controls, styled:** a `<fieldset>` of real radio inputs (so a radio group is one Tab stop and arrow keys change the choice) and a native `<select>` (the platform picker on phones).
  *Not picked:* custom ARIA radio cards and listboxes, which re-implement keyboard and screen reader behavior the browser already provides.
- **Radios show their focus ring on any focus, not only `:focus-visible`.** In WebKit, `:focus-visible` stops matching once arrow keys move between radios, so Safari keyboard users lost the ring; our WebKit tests caught it. The cost is a ring after a mouse click on a radio in other browsers.
  *Not picked:* `:focus-visible` everywhere, which fails WCAG 2.4.7 in Safari.
- **The visual check allows 1.5% differing pixels.** The finished build measures 0.98% in Chromium on Windows, and that remainder is glyph rasterization and photo resampling (the reference was most likely rendered on macOS). Every row was also measured to within 1px of the reference during the build.
  *Not picked:* a 0% target, which no cross-platform render can reach.
- **Three reference colors are darkened slightly to meet WCAG 2.2 AA contrast.** Each is the smallest same-hue darkening that passes, with a small margin:

  | Element | Reference | Ratio | Ours | Ratio |
  |---|---|---|---|---|
  | Eyebrow, reviews link, fine print (text, needs 4.5:1) | `#6b7a70` | 4.27 | `#647269` | 4.77 |
  | Compare price $29.95 (text, needs 4.5:1) | `#8a948e` | 2.87 | `#647269` | 4.64 |
  | Unselected radio ring (non-text, needs 3:1) | `#9aa59e` | 2.55 | `#849189` | 3.29 |

  The compare price is struck through but still carries real information (the saving), and WCAG only exempts incidental or disabled text. The radio ring is what identifies the control and its state.
  *Kept as designed:* the light borders on the option cards, the frequency select and the quantity stepper (1.3 to 1.5:1). WCAG 1.4.11 asks for 3:1 only on the visual information needed to identify a control, and here other cues do that: the radio and its label, the select's chevron (7.8:1) and the stepper's minus and plus signs (7.8:1). The stars (2.2:1) are decorative, because the "4.8" next to them and the accessible name carry the rating, so they are hidden from assistive technology.
  *Not picked:* the exact reference colors, which would ship known AA failures.
- **Focus indicators are a 2px brand-green outline with a 2px offset**, so the ring always sits on the surface around a control: 10.95:1 on the page, 11.6:1 on white and 10.64:1 on the selected card. On the dark Add to cart button the offset keeps the ring on the page background rather than green on green. The reference shows no focus state, so this is our design.
  *Not picked:* the browser's default focus ring, which differs between browsers and isn't guaranteed to reach 3:1 on every background.
- **Screen readers hear the rating as "Rated 4.8 out of 5"**, from visually hidden text around the visible "4.8", rather than five star icons.
  *Not picked:* `role="img"` with an `aria-label` on the stars, which hides the visible number from assistive technology.
- **The fine print is built from the current selection** by our own function, because `copy.finePrint` hardcodes "30 days" and "$25.46". The frequency comes from `copy.subscribe.frequencyOptions` and the price from `copy.subscribe.priceCents`, so only the sentence frame is ours. A unit test checks that the default selection (30 days, quantity 1) produces exactly `copy.finePrint`, so the two can't drift apart unnoticed.
  *Not picked:* turning `copy.finePrint` into a function in `copy.ts`. One source, but it rewrites a file the brief provides.
- **The frequency select sits outside the radio's `<label>`**, because nesting interactive controls inside a label is invalid HTML and confuses assistive technology.

## How I used AI

- I built this in Claude Code. I made the product and design decisions; Claude researched the options, implemented them and ran the checks, one step at a time, waiting for my approval between steps. The full, unedited conversation is in [`docs/ai-conversation.md`](docs/ai-conversation.md).
- I used a separate Claude chat as a second reviewer, to improve my prompts and to check outputs before approving them (for example the Part B decisions on the collapsed card and the fine print).
- `CLAUDE.md` set the working rules: research before each decision, a reason and an alternative for each choice, tests in the same step as the code and seen failing once, root causes instead of patches, WCAG 2.2 AA, and no AI attribution in the code or commits.
- An independent reviewer agent, with no access to the conversation, checked the finished work against the brief and `CLAUDE.md`.

Moments where the work was checked and corrected:

- **The 1024px breakpoint.** The first Part B layout stacked everything below 1024px. Reviewing it in the browser, I saw the photo grow to full width and noted that a 1280px laptop at 125% or 150% Windows scaling falls in that range. After research into Shopify's Dawn theme it became three layouts, and a width sweep test from 320 to 1440px now fails if the photo grows past its reference size.
- **The overflowing price.** Around 350 to 400px, "$25.46" spilled out of the Add to cart button. The root cause was a fixed minimum width tuned to one price; it became `min-width: max-content`. The new width sweep failed on the old build before the fix, as it should.
- **The nav focus ring.** A focused link's ring touched the active pill next to it (a 4px gap and a 4px ring). The gap was increased, and a test now measures the clear space.
- **The bundle in the swap offer.** The first swap offer replaced Vitamin D without asking, and offered the Daily Essentials Bundle, which already contains it. It now lists each swap as its own choice and never offers a bundle that contains the product being replaced.
- **Checks that could pass without testing anything.** Component tests were first running without the app's CSS, so axe was checking contrast against unstyled defaults; the axe helper's failure message hid which rule failed. Both were caught by making each new check fail once before trusting it.
- **Browser differences.** WebKit tests showed that Safari drops the focus ring when arrow keys move between radio buttons, so radios show the ring on any focus.
- **The independent review.** It found state bugs that the existing tests passed: the cancel flow could set a 120-day frequency the page couldn't show, offered "less often" deliveries that were more often at 90 days, didn't start over after an accepted offer, and offered a pause to an already paused subscription. On a phone, a confirmation could land off-screen. Each fix came with a test that failed without it.
