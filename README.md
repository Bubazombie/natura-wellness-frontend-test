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
- **Below 1200px the layout stacks**: photo on top, details below, like a typical mobile product page. The exact breakpoint is chosen during the Part B build.
  *Not picked:* scaling the two-column layout down, which gets cramped on phones.
- **The rating has the accessible name "Rated 4.8 out of 5"**, so screen readers get the value rather than five star icons.
- **The fine print is built from the current selection** instead of using the hardcoded `copy.finePrint` string.
- **The frequency select sits outside the radio's `<label>`**, because nesting interactive controls inside a label is invalid HTML and confuses assistive technology.
