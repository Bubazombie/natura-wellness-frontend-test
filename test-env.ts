// Shared by the Vitest and Playwright configs so every test run formats dates and money the same way.
// A non-UTC zone with daylight saving time surfaces code that silently assumes UTC.
export const TEST_LOCALE = "en-US";
export const TEST_TIMEZONE = "America/New_York";
