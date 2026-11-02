# CLAUDE.md

## Rule zero: no AI attribution
- No Co-Authored-By trailers, "Generated with" lines, or mentions of Claude, Anthropic or any AI tool in commit messages, PR descriptions, code, comments, UI copy or docs.
- Exceptions: CLAUDE.md, .claude/settings.json, .githooks/, docs/ai-conversation.md, and the "How I used AI" section of README.md.
- Enforced by .claude/settings.json (attribution off) and .githooks/commit-msg. Enable the hook in every clone: `git config core.hooksPath .githooks`.

## Where things live
- Part A: src/part-a (entry SubscriptionCard.tsx). Part B: src/part-b (entry BuyBox.tsx). Brief: INSTRUCTIONS.md.
- src/api/* and src/part-b/copy.ts are the given contract: read them, don't edit them.
- Every decision and its reason goes in README.md "Decisions and trade-offs", in the same step it is made. This file holds working rules only and never repeats decisions.

## How we work
- The user makes product and design decisions. Claude researches, implements and verifies.
- Research current best practice before every decision, in priority order UX, UI, engineering. Report findings briefly, with sources.
- Push back on choices that are wrong and on ones that work but aren't the best option. Propose the better one.
- For each meaningful choice: a short reason and the main alternative not picked.
- One step at a time: a one-line purpose before each step, then wait for the user's OK.
- Scope: only what the brief or these rules need. Nothing "just in case".
- Never call something done or working without verifying it (typecheck, lint, tests, build, and the browser for UI). Say what couldn't be verified.
- Bugs: find the root cause before changing code. No symptom patches.
- Leave nothing behind: stop every dev server, browser or test runner started for a check before the step ends. Temporary probes or review tests are deleted before the step ends, and review screenshots are kept outside the repo.

## Engineering
- Follow SOLID, DRY, KISS and YAGNI. In React that means:
  - Small, single-responsibility components.
  - Data fetching and state logic in hooks; presentational components stay pure.
  - No duplicated logic and no magic values: use named constants and Tailwind @theme tokens.
  - Nothing built "just in case".
- TypeScript strict, no `any`, explicit types for API data and props, clear names.
- English for code, comments and UI copy. Comments only where the why isn't obvious.
- No em dashes anywhere: code, UI copy, docs, commit messages.

## Accessibility and responsiveness
- WCAG 2.2 AA, no exceptions: semantic HTML, full keyboard support, visible focus, focus management in dialogs, a label on every control, aria-live for status and errors, AA contrast, targets at least 24x24px (2.5.8) and 44x44px on mobile, prefers-reduced-motion respected.
- Part A: mobile-first at 375px; correct at every width from 320px to large desktop.
- Part B: as close to pixel-perfect as possible at 1200px (2x) against public/reference/buy-box.png; solid at every other width.
- Every API state handled: loading (up to 2.5s), error, 409 conflict, paused, cancelled. The customer always knows what happened and what to do next.

## Testing
- Every change ships with every test that makes sense for it, in the same step: unit tests (Node) for logic, component and integration tests (Vitest browser mode) for components and user flows, axe-core checks in component tests, Playwright e2e including 375px with @axe-core/playwright.
- Cover edge cases: slow responses, errors, 409, items without an image, keyboard-only use.
- Test files sit next to the code they test. `*.test.ts` runs in Node (pure logic); `*.test.tsx` runs in Chromium (components, hooks, flows); `e2e/*.spec.ts` is Playwright.
- Use `expectNoAxeViolations` from src/test/axe.ts in component tests and `WCAG_AA_TAGS` from src/test/a11y.ts with AxeBuilder in e2e.
- Keep tests deterministic: pin `conflict=never|always` or mock Math.random, use fake timers. Locale and timezone are pinned in test-env.ts.
- A new check must be seen failing once (a temporary probe is fine) before it is trusted to pass.
- After every change, run the whole suite plus typecheck and lint, and report the results unasked.
- A failing test means stop and fix the root cause. Never delete, skip or weaken a test to make it pass.

## Design process
- Part A: build the UI with fixture data first, review it at 375px and desktop, iterate until the user approves, and only then wire the API and state.
- Part B: verify with `npx playwright test --project=visual` (1200x780, deviceScaleFactor 2, pixelmatch against the reference). Review the saved diff.png, not only the percentage.

## Git
- Branch main. Small commits, one logical change each, only after verification passes.
- Message: imperative subject of 72 characters or fewer, no type prefix; a body that explains the why when it isn't obvious.
- Before each commit: review the diff against this file, report findings, fix them, then commit.

## Commands
- `npm run check` runs typecheck, lint, Vitest and Playwright: the full verification after every change.
- Individually: `npm run dev`, `npm run typecheck`, `npm run lint`, `npm run test` (Vitest), `npm run test:e2e` (Playwright), `npm run build`.
- Part A: `/?part=a&fixture=active|paused|cancelled|error`, plus `&conflict=always|never`. Part B: `/?part=b`.
