import { expect as baseExpect, test, type Page } from "@playwright/test";

// Against the real mock API, which waits up to 2.5s per call; a skip after a conflict makes three
// calls (skip, refetch, skip), so assertions get room for that.
const expect = baseExpect.configure({ timeout: 12_000 });
const DAY_MS = 24 * 60 * 60 * 1000;
const shortDate = (date: Date) => date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

async function openActive(page: Page, conflict: "never" | "always") {
  await page.goto(`/?part=a&fixture=active&conflict=${conflict}`);
  await expect(page.getByRole("region", { name: "Next delivery", exact: true })).toBeVisible();
}

async function confirmSkip(page: Page) {
  await page.getByRole("button", { name: "Skip this delivery" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: /^Skip .+ delivery$/ }).click();
  return dialog;
}

test("a skip goes through: the dialog closes, the date moves on, and the page says so", async ({ page }) => {
  await openActive(page, "never");
  // The active fixture's next delivery is six days out; the mock moves it by 30 days.
  const next = new Date(Date.now() + 6 * DAY_MS);
  const after = new Date(next.getTime() + 30 * DAY_MS);

  // Opened with the keyboard: Safari doesn't focus a button on a mouse click, so focus return is
  // only meaningful (and only checked) for keyboard users, who are the ones who need it.
  const trigger = page.getByRole("button", { name: "Skip this delivery" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: /^Skip .+ delivery$/ }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByText(`Done. Your ${shortDate(next)} delivery is skipped. Your next delivery is ${shortDate(after)}.`)).toBeVisible();
  await expect(trigger).toBeFocused();
});

test("a conflict shows the latest details and asks again; repeated conflicts offer support", async ({ page }) => {
  await openActive(page, "always");

  const dialog = await confirmSkip(page);
  await expect(dialog.getByRole("alert")).toContainText("Your subscription changed since you opened this page, so we didn't skip anything.");
  await expect(dialog.getByRole("link", { name: "help@natura-wellness.example" })).toBeHidden();

  await dialog.getByRole("button", { name: /^Skip .+ delivery$/ }).click();
  await expect(dialog.getByRole("link", { name: "help@natura-wellness.example" })).toBeVisible();

  await dialog.getByRole("button", { name: "Keep it" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText(/delivery is skipped/)).toBeHidden();
});

test("the error fixture says nothing changed, and Try again shows loading and then the error again", async ({ page }) => {
  await page.goto("/?part=a&fixture=error");
  const heading = page.getByRole("heading", { name: "We couldn't load your subscription" });
  await expect(heading).toBeVisible();

  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Loading your subscription" })).toBeAttached();
  await expect(heading).toBeVisible();
  await expect(page.getByRole("link", { name: "help@natura-wellness.example" })).toBeVisible();
});

test("an unknown subscription says it can't be found and offers support, without a retry", async ({ page }) => {
  await page.goto("/?part=a&fixture=nope");

  await expect(page.getByRole("heading", { name: "We couldn't find a subscription on your account" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toBeHidden();
  await expect(page.getByRole("link", { name: "help@natura-wellness.example" })).toBeVisible();
});

test("a frequency change survives a successful skip, and the new date uses the chosen frequency", async ({ page }) => {
  await openActive(page, "never");
  const next = new Date(Date.now() + 6 * DAY_MS);
  const frequency = page.getByRole("combobox", { name: "Delivery frequency" });

  await frequency.selectOption({ label: "Every 60 days" });
  await expect(page.getByText(`Your ${shortDate(next)} delivery is unchanged. After that, you'll get a delivery every 60 days.`)).toBeVisible();
  await confirmSkip(page);

  await expect(page.getByText(`Your next delivery is ${shortDate(new Date(next.getTime() + 60 * DAY_MS))}.`, { exact: false })).toBeVisible();
  await expect(frequency).toHaveValue("60");
});

test("local changes survive the refetch after a conflict", async ({ page }) => {
  await openActive(page, "always");
  const frequency = page.getByRole("combobox", { name: "Delivery frequency" });

  await frequency.selectOption({ label: "Every 90 days" });
  const dialog = await confirmSkip(page);
  await expect(dialog.getByRole("alert")).toBeVisible();
  await dialog.getByRole("button", { name: "Keep it" }).click();

  await expect(frequency).toHaveValue("90");
});

test("cancelling confirms on the card and moves focus there; restarting makes it active again", async ({ page }) => {
  await openActive(page, "never");

  await page.getByRole("main").getByRole("button", { name: "Cancel subscription" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Cancel subscription" }).click();

  const heading = page.getByRole("heading", { name: "Your subscription is cancelled" });
  await expect(heading).toBeFocused();
  await expect(page.getByText("You cancelled today. You won't be charged again.")).toBeVisible();

  await page.getByRole("button", { name: "Restart subscription" }).click();
  await expect(page.getByRole("region", { name: "Next delivery", exact: true })).toBeVisible();
  await expect(page.getByText("Active", { exact: true })).toBeVisible();
});

test("after accepting an offer in the cancel flow, its confirmation is on screen, even on a phone", async ({ page }) => {
  await openActive(page, "never");

  await page.getByRole("main").getByRole("button", { name: "Cancel subscription" }).click();
  await page.getByRole("radio", { name: "It costs too much" }).check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /^Get 1 Multivitamin instead of 2/ }).click();

  const confirmation = page.getByText("Done. You'll get 1 of Multivitamin, 30 tablets in each delivery", { exact: false });
  await expect(confirmation).toBeInViewport();
});
