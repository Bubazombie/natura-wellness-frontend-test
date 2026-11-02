# Natura Wellness frontend test

Natura Wellness is a fictional brand made up for this test. The full brief is in `INSTRUCTIONS.md`.

```
npm install
npm run dev
```

- **Part A:** `src/part-a/SubscriptionCard.tsx`. Open `/?part=a&fixture=active`. The mock API is in `src/api/`; switch cases with `?fixture=active|paused|cancelled|error` and force the "changed elsewhere" error with `&conflict=always`. Other products are in `catalog` in `src/api/fixtures.ts`.
- **Part B:** `src/part-b/BuyBox.tsx`. Open `/?part=b`. Match `public/reference/buy-box.png`, which is a 2x screenshot of a 1200px-wide browser window. Copy is in `src/part-b/copy.ts`; Fraunces and Inter are loaded in `index.html`.

You can add any libraries you like.

## Decisions and trade-offs

Each decision lists why we made it and the main alternative we didn't pick.

### Stack

- **Tailwind CSS v4** (via `@tailwindcss/vite`). Design values live as `@theme` tokens in CSS, which suits Part B's exact spacing and colors and gives both parts one shared scale.
  *Not picked:* CSS Modules. No dependency, but more files and no shared token scale.
- **TanStack Query** for loading the subscription and the skip mutation. It handles request dedupe (React StrictMode mounts twice in development), pending and error state, refetching after a 409, and updating the cache from the skip response. Retries are off for mutations and 4xx errors, because retrying a 409 hides a real conflict and the default retries would add seconds to the error state.
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

### Part B: buy box

- **Subscribe is selected by default**, as in the reference.
  *Not picked:* one-time by default, which doesn't match the design.
- **With one-time selected, the subscribe card collapses to its top row** (radio, label, badge, price and compare price) and hides the frequency and perks. The collapse is animated and respects `prefers-reduced-motion`. Shopify's subscription UX guidelines suggest collapsing the unselected option without hiding its name, and this keeps the savings visible.
  *Not picked:* keeping both cards fully expanded, which shows controls that do nothing for the current choice.
- **With one-time selected, the fine print is hidden.** It's an auto-renewal disclosure, and a one-time purchase has nothing to renew.
  *Not picked:* rewording it for one-time purchases, which adds copy the design doesn't have.
- **The fine print reflects quantity and frequency**, for example "renews every 60 days at $50.92" for 2 units, because auto-renewal laws require stating what will actually be charged and how often. The Add to cart button shows the total too, while prices inside the cards stay per unit.
  *Not picked:* a static fine print, which would misstate the charge.
- **Quantity goes from 1 to 10.** Minus is disabled at 1 and plus at 10. The number in the middle is an editable, labelled input. The maximum of 10 is a product call, not a standard.
  *Not picked:* no maximum, which allows accidental bulk orders.
- **The "2,316 reviews" link points to `#reviews`**, the usual anchor for a reviews section. The reviews section itself is out of scope for this test.
  *Not picked:* rendering it as plain text, which loses the expected path to reviews.
- **Below 1024px the layout stacks**: photo on top, details below, like a typical mobile product page. The breakpoint comes from the content, not from device widths: the subscribe row needs about 420px, and at 1024px the details column is 427px with every row still on one line. From 1024 to 1199px the gutters and column gap are 32px and 40px; from 1200px they are the reference's 64px. Checked with no horizontal overflow at 320, 375, 768, 1023, 1024, 1100, 1199, 1200 and 1440px.
  *Not picked:* stacking only below 1200px, which would show a stretched single column on small laptops and tablets in landscape; or scaling the two columns down to phone widths, which gets cramped.
- **At very narrow widths, controls wrap instead of squeezing.** Below about 330px the Add to cart button moves to its own full-width row rather than breaking "Add to cart · $25.46" over two lines, and the frequency select moves under its label. Below 1024px the select is 44px tall and the reviews link has a 44px tall hit area, our mobile target; at 1200px the select keeps the reference's 33px.
  *Not picked:* a smaller font for the button on phones, which hurts legibility of the main action.
- **The selected option is drawn with a 1px border plus a 1px inset ring**, so it looks like the reference's 2px border while the content stays exactly where it was. Switching options never shifts the layout.
  *Not picked:* a real 2px border, which moves the content by 1px on every change.
- **Native controls, styled:** a `<fieldset>` of real radio inputs (so a radio group is one Tab stop and arrow keys change the choice) and a native `<select>` (the platform picker on phones).
  *Not picked:* custom ARIA radio cards and listboxes, which re-implement keyboard and screen reader behavior the browser already provides.
- **Radios show their focus ring on any focus, not only `:focus-visible`.** In WebKit, `:focus-visible` stops matching once arrow keys move between radios, so Safari keyboard users lost the ring; our WebKit tests caught it. The cost is a ring after a mouse click on a radio in other browsers.
  *Not picked:* `:focus-visible` everywhere, which fails WCAG 2.4.7 in Safari.
- **The visual check allows 1.5% differing pixels.** The finished build measures 1.25% in Chromium on Windows, and that remainder is glyph rasterization and photo resampling (the reference was most likely rendered on macOS). Every row was also measured to within 1px of the reference during the build.
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
- **The rating has the accessible name "Rated 4.8 out of 5"**, so screen readers get the value rather than five star icons.
- **The fine print is built from the current selection** by our own function, because `copy.finePrint` hardcodes "30 days" and "$25.46". The frequency comes from `copy.subscribe.frequencyOptions` and the price from `copy.subscribe.priceCents`, so only the sentence frame is ours. A unit test checks that the default selection (30 days, quantity 1) produces exactly `copy.finePrint`, so the two can't drift apart unnoticed.
  *Not picked:* turning `copy.finePrint` into a function in `copy.ts`. One source, but it rewrites a file the brief provides.
- **The frequency select sits outside the radio's `<label>`**, because nesting interactive controls inside a label is invalid HTML and confuses assistive technology.
