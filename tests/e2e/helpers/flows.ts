import { expect, type Page } from "@playwright/test";

// /session now opens on a fork ("What do you need right now?"). Pick the pause
// path and clear the mood check-in to land on the "what kind of pause" chooser.
export async function startTinyPauseFromEntry(page: Page) {
  await page.getByRole("button", { name: "Take a tiny pause" }).click();
  await page.getByRole("button", { name: "Skip for now" }).click();
}

export async function completeAnonymousSession(page: Page) {
  await page.goto("/session");
  await startTinyPauseFromEntry(page);
  await page.getByRole("button", { name: "Just a pause" }).click();
  await expect(page.getByRole("heading", { name: "Try this tiny pause" })).toBeVisible();
  const promptTitle = (await page.locator("h2").first().textContent())?.trim() ?? "";
  await page.getByRole("button", { name: "I did it" }).click();
  await expect(page.getByRole("heading", { name: "How do you feel now?" })).toBeVisible();
  await page.getByRole("button", { name: "Okay" }).click();
  await expect(page.getByRole("heading", { name: /You just took a tiny pause/i })).toBeVisible();
  return { promptTitle };
}

export async function completeLoggedInSession(page: Page) {
  await page.goto("/session");
  await startTinyPauseFromEntry(page);
  await page.getByRole("button", { name: "Just a pause" }).click();
  await expect(page.getByRole("heading", { name: "Try this tiny pause" })).toBeVisible();
  await page.getByRole("button", { name: "I did it" }).click();
  await page.getByRole("button", { name: "Okay" }).click();
  await expect(page.getByRole("heading", { name: /You just took a tiny pause/i })).toBeVisible();
}
