import { expect, type Page } from "@playwright/test";

export async function completeAnonymousSession(page: Page) {
  await page.goto("/session");
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
  await page.getByRole("button", { name: "Just a pause" }).click();
  await expect(page.getByRole("heading", { name: "Try this tiny pause" })).toBeVisible();
  await page.getByRole("button", { name: "I did it" }).click();
  await page.getByRole("button", { name: "Okay" }).click();
  await expect(page.getByRole("heading", { name: /You just took a tiny pause/i })).toBeVisible();
}
