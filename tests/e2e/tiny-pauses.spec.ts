import { expect, test } from "@playwright/test";
import { completeAnonymousSession, completeLoggedInSession } from "./helpers/flows";
import {
  clearMoments,
  completeSignupFromEmailLink,
  countMoments,
  deletePromptByTitle,
  deleteUserById,
  ensureUser,
  getE2EEnv,
  getProfile,
  insertMoment,
  listMoments,
  makeUniqueEmail,
  signInWithMagicLink,
  upsertProfile,
} from "./helpers/supabase";

test.describe("Tiny Pauses critical E2E flows", () => {
  test("TEST 1 -- Anonymous session flow", async ({ page }) => {
    await page.goto("/session");
    await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();

    await page.getByRole("button", { name: "Just a pause" }).click();
    await expect(page.getByRole("heading", { name: "Try this tiny pause" })).toBeVisible();
    await expect(page.getByText("Your tiny step")).toBeVisible();

    await page.getByRole("button", { name: "I did it" }).click();
    await expect(page.getByRole("heading", { name: "How do you feel now?" })).toBeVisible();
    await page.getByRole("button", { name: "Okay" }).click();

    await expect(page.getByRole("button", { name: "Keep this moment" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Share this moment" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Go to my dashboard" })).toHaveCount(0);
  });

  test("TEST 2 -- Anonymous to signup flow", async ({ page }) => {
    const email = makeUniqueEmail("signup-flow");
    let createdUserId: string | null = null;
    try {
      const { promptTitle } = await completeAnonymousSession(page);
      await page.getByRole("button", { name: "Keep this moment" }).click();
      await expect(page).toHaveURL(/\/login/);

      await page.getByPlaceholder("you@example.com").fill(email);
      await page.getByRole("checkbox").check();
      await page.getByRole("button", { name: "Send me a sign‑in link" }).click();
      await expect(page.getByText("Check your email for a sign‑in link")).toBeVisible();

      const user = await completeSignupFromEmailLink(page, email);
      createdUserId = user.id;

      const moments = await listMoments(user.id);
      expect(moments.length).toBeGreaterThan(0);
      if (promptTitle) {
        expect(moments.some((row) => row.prompt_name === promptTitle)).toBeTruthy();
      }

      await expect(page).toHaveURL(/\/onboarding/);
      await expect(page.getByRole("heading", { name: "Who's this for?" })).toBeVisible();
      await expect(
        page.getByRole("button", { name: "I'm setting this up for my child" }),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: "This is for me" })).toBeVisible();
    } finally {
      if (createdUserId) {
        await deleteUserById(createdUserId);
      }
    }
  });

  test("TEST 3 -- Onboarding child path", async ({ page }) => {
    const email = makeUniqueEmail("child-onboarding");
    let userId: string | null = null;
    const childName = "Milo";
    try {
      const user = await ensureUser(email);
      userId = user.id;
      await upsertProfile(user.id, {
        adult_mode: false,
        onboarding_complete: false,
        onboarding_skipped: false,
        child_name: null,
        display_name: null,
      });

      await signInWithMagicLink(page, email);
      await expect(page).toHaveURL(/\/onboarding/);
      await expect(page.getByRole("heading", { name: "Who's this for?" })).toBeVisible();

      await page.getByRole("button", { name: "I'm setting this up for my child" }).click();
      await page.getByRole("button", { name: "Let's get started" }).click();
      await page.getByRole("button", { name: "Got it" }).click();
      await page.getByRole("button", { name: "I appreciate that" }).click();
      await page.getByPlaceholder("First name").fill(childName);
      await page.getByRole("button", { name: "That's them" }).click();
      await page.getByRole("button", { name: "After school" }).click();
      await page.getByRole("button", { name: "That works" }).click();
      await page.getByRole("button", { name: "I'll explore on my own first" }).click();

      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.getByRole("heading", { name: `Hi, ${childName}.` })).toBeVisible();

      const profile = await getProfile(user.id);
      expect(profile?.child_name).toBe(childName);
      expect(profile?.onboarding_complete).toBe(true);
    } finally {
      if (userId) await deleteUserById(userId);
    }
  });

  test("TEST 4 -- Onboarding adult path", async ({ page }) => {
    const email = makeUniqueEmail("adult-onboarding");
    let userId: string | null = null;
    const displayName = "Alex";
    try {
      const user = await ensureUser(email);
      userId = user.id;
      await upsertProfile(user.id, {
        adult_mode: false,
        onboarding_complete: false,
        onboarding_skipped: false,
        display_name: null,
      });

      await signInWithMagicLink(page, email);
      await expect(page).toHaveURL(/\/onboarding/);
      await page.getByRole("button", { name: "This is for me" }).click();

      let profile = await getProfile(user.id);
      expect(profile?.adult_mode).toBe(true);

      await page.getByPlaceholder("Your name").fill(displayName);
      await page.getByRole("button", { name: "That's me" }).click();
      await expect(page.getByRole("heading", { name: "You're all set." })).toBeVisible();
      await page.getByRole("link", { name: "Take my first tiny pause" }).click();
      await expect(page).toHaveURL(/\/session/);

      await page.goto("/dashboard");
      await expect(page.getByRole("heading", { name: `Hi, ${displayName}.` })).toBeVisible();

      profile = await getProfile(user.id);
      expect(profile?.display_name).toBe(displayName);
      expect(profile?.onboarding_complete).toBe(true);
    } finally {
      if (userId) await deleteUserById(userId);
    }
  });

  test("TEST 5 -- Onboarding skip", async ({ page }) => {
    const email = makeUniqueEmail("skip-onboarding");
    let userId: string | null = null;
    try {
      const user = await ensureUser(email);
      userId = user.id;
      await upsertProfile(user.id, {
        adult_mode: false,
        onboarding_complete: false,
        onboarding_skipped: false,
      });

      await signInWithMagicLink(page, email);
      await expect(page).toHaveURL(/\/onboarding/);
      await page.getByRole("button", { name: "I'm setting this up for my child" }).click();
      await page.getByRole("button", { name: "Skip setup" }).click();

      await expect(page).toHaveURL(/\/dashboard/);
      const profile = await getProfile(user.id);
      expect(profile?.onboarding_complete).toBe(true);
    } finally {
      if (userId) await deleteUserById(userId);
    }
  });

  test("TEST 6 -- Logged in session flow", async ({ page }) => {
    const email = makeUniqueEmail("logged-in-session");
    let userId: string | null = null;
    try {
      const user = await ensureUser(email);
      userId = user.id;
      await upsertProfile(user.id, {
        adult_mode: false,
        onboarding_complete: true,
        child_name: "Riley",
      });

      const countBefore = await countMoments(user.id);
      await signInWithMagicLink(page, email);
      await completeLoggedInSession(page);

      await expect(page.getByRole("link", { name: "Go to my dashboard" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Save this prompt" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Keep this moment" })).toHaveCount(0);

      await page.getByRole("link", { name: "Go to my dashboard" }).click();
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.getByText("Your check-ins")).toBeVisible();

      const countAfter = await countMoments(user.id);
      expect(countAfter).toBeGreaterThan(countBefore);
    } finally {
      if (userId) await deleteUserById(userId);
    }
  });

  test("TEST 7 -- Brain Break complete flow", async ({ page }) => {
    await page.goto("/session");
    await page.getByRole("button", { name: "Brain Break" }).click();
    await expect(page.getByRole("heading", { name: "Brain Break" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Quiet" })).toBeVisible();
    await expect(page.getByRole("button", { name: "With sound" })).toBeVisible();

    await page.getByRole("button", { name: "Let's go" }).click();
    await expect(page.getByText("Step 1 of 6")).toBeVisible();
    await expect(
      page.getByText("Shake your hands like you're flicking water off them."),
    ).toBeVisible();

    for (let i = 0; i < 5; i += 1) {
      await page.getByRole("button", { name: "I did it" }).click();
    }

    await expect(page.getByText("Your brain slowed down. You did that.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Take a tiny pause" })).toBeVisible();
    await expect(page.getByRole("button", { name: "I'm good, thanks" })).toBeVisible();

    await page.getByRole("button", { name: "I'm good, thanks" }).click();
    await expect(page).toHaveURL(/\/($|session|dashboard)/);
  });

  test("TEST 8 -- Dashboard loads correctly", async ({ page }) => {
    const env = getE2EEnv();
    const user = await ensureUser(env.testUserEmail);
    await upsertProfile(user.id, {
      adult_mode: false,
      onboarding_complete: true,
      child_name: "Riley",
      display_name: null,
    });

    await clearMoments(user.id);
    await insertMoment(user.id, {
      category: "Brain break",
      prompt_name: "Brain Break",
      mood_value: null,
    });
    await insertMoment(user.id, {
      category: "Just a pause",
      prompt_name: "E2E dashboard seed prompt",
      mood_value: 4,
    });

    await signInWithMagicLink(page, env.testUserEmail);
    await page.goto("/dashboard");

    await expect(page.getByRole("heading", { name: "Hi, Riley." })).toBeVisible();
    await expect(page.getByText("This week")).toBeVisible();
    await expect(page.getByText("Your check-ins")).toBeVisible();
    await expect(page.getByText(/You also took \d+ brain break/)).toBeVisible();

    await clearMoments(user.id);
  });

  test("TEST 9 -- Admin panel access control", async ({ page }) => {
    const nonAdminEmail = makeUniqueEmail("non-admin");
    let nonAdminId: string | null = null;
    try {
      await page.goto("/admin");
      await expect(page).not.toHaveURL(/\/admin$/);

      const nonAdmin = await ensureUser(nonAdminEmail);
      nonAdminId = nonAdmin.id;
      await upsertProfile(nonAdmin.id, { onboarding_complete: true });
      await signInWithMagicLink(page, nonAdminEmail);
      await page.goto("/admin");
      await expect(page).not.toHaveURL(/\/admin$/);

      if (await page.getByRole("button", { name: "Sign out" }).count()) {
        await page.getByRole("button", { name: "Sign out" }).click();
      }

      const env = getE2EEnv();
      await ensureUser(env.adminEmail);
      await signInWithMagicLink(page, env.adminEmail);
      await page.goto("/admin");
      await expect(page).toHaveURL(/\/admin/);
      await expect(page.getByRole("button", { name: "Add new prompt" })).toBeVisible();
    } finally {
      if (nonAdminId) await deleteUserById(nonAdminId);
    }
  });

  test("TEST 10 -- Admin prompt creation", async ({ page }) => {
    const promptTitle = `E2E prompt ${Date.now()}`;
    const regularEmail = makeUniqueEmail("prompt-rotation");
    let regularUserId: string | null = null;
    try {
      const env = getE2EEnv();
      await ensureUser(env.adminEmail);
      await signInWithMagicLink(page, env.adminEmail);
      await page.goto("/admin");
      await page.getByRole("button", { name: "Add new prompt" }).click();

      await page.getByLabel("Category").selectOption("kindness");
      await page.getByLabel("Prompt name").fill(promptTitle);
      await page.getByLabel("Body text").fill("A gentle prompt added by e2e.");
      await page.getByLabel("Tiny step text").fill("Take one breath and unclench your jaw.");
      await page.getByLabel("active").check();
      await page.getByRole("button", { name: "Save" }).click();
      await expect(page.getByText(promptTitle)).toBeVisible();

      const regularUser = await ensureUser(regularEmail);
      regularUserId = regularUser.id;
      await upsertProfile(regularUser.id, {
        onboarding_complete: true,
        adult_mode: false,
        child_name: "Casey",
      });

      if (await page.getByRole("button", { name: "Sign out" }).count()) {
        await page.getByRole("button", { name: "Sign out" }).click();
      }

      await signInWithMagicLink(page, regularEmail);
      let seen = false;
      for (let attempt = 0; attempt < 12; attempt += 1) {
        await page.goto("/session");
        await page.getByRole("button", { name: "Kindness" }).click();
        await expect(page.getByRole("heading", { name: "Try this tiny pause" })).toBeVisible();
        if (await page.getByRole("heading", { level: 2, name: promptTitle }).count()) {
          seen = true;
          break;
        }
      }
      expect(seen).toBeTruthy();
    } finally {
      if (regularUserId) await deleteUserById(regularUserId);
      await deletePromptByTitle(promptTitle);
    }
  });
});
