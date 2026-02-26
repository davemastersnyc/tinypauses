import { expect, type Page } from "@playwright/test";
import { createClient, type User } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.test", quiet: true });
dotenv.config({ quiet: true });

type ProfilePatch = {
  adult_mode?: boolean;
  onboarding_complete?: boolean;
  onboarding_skipped?: boolean;
  child_name?: string | null;
  display_name?: string | null;
  anchor_moment?: string | null;
};

type E2EEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  adminEmail: string;
  testUserEmail: string;
  testAdminEmail: string;
  emailDomain: string;
  appBaseUrl: string;
};

let envCache: E2EEnv | null = null;
let adminClientCache: ReturnType<typeof createClient> | null = null;

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env var for e2e tests: ${name}`);
  }
  return value;
}

export function getE2EEnv(): E2EEnv {
  if (envCache) return envCache;
  envCache = {
    supabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseAnonKey: required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    supabaseServiceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
    adminEmail: required("ADMIN_EMAIL").toLowerCase(),
    testUserEmail: required("E2E_TEST_USER_EMAIL").toLowerCase(),
    testAdminEmail: required("E2E_TEST_ADMIN_EMAIL").toLowerCase(),
    emailDomain: process.env.E2E_EMAIL_DOMAIN?.trim().toLowerCase() ?? "example.com",
    appBaseUrl: process.env.E2E_BASE_URL?.trim() || "http://localhost:3000",
  };
  return envCache;
}

function supabaseAdmin() {
  if (adminClientCache) return adminClientCache;
  const env = getE2EEnv();
  adminClientCache = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClientCache;
}

export async function findUserByEmail(email: string) {
  let page = 1;
  while (page < 20) {
    const { data, error } = await supabaseAdmin().auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    const matched =
      data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) ??
      null;
    if (matched) return matched;
    if (data.users.length < 200) break;
    page += 1;
  }
  return null;
}

export async function ensureUser(email: string) {
  const existing = await findUserByEmail(email);
  if (existing) return existing;
  const { data, error } = await supabaseAdmin().auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("Could not create user.");
  return data.user;
}

export function makeUniqueEmail(prefix: string) {
  const env = getE2EEnv();
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${prefix}-${stamp}@${env.emailDomain}`;
}

export async function upsertProfile(userId: string, patch: ProfilePatch) {
  const { error } = await supabaseAdmin()
    .from("profiles")
    .upsert({ id: userId, ...patch }, { onConflict: "id" });
  if (error) throw error;
}

export async function getProfile(userId: string) {
  const { data, error } = await supabaseAdmin()
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function countMoments(userId: string) {
  const { count, error } = await supabaseAdmin()
    .from("moments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) throw error;
  return count ?? 0;
}

export async function listMoments(userId: string) {
  const { data, error } = await supabaseAdmin()
    .from("moments")
    .select("id,prompt_name")
    .eq("user_id", userId);
  if (error) throw error;
  return data ?? [];
}

export async function clearMoments(userId: string) {
  const { error } = await supabaseAdmin().from("moments").delete().eq("user_id", userId);
  if (error) throw error;
}

export async function insertMoment(
  userId: string,
  data: {
    category: string;
    prompt_name: string;
    mood_value?: number | null;
    special_type?: "seasonal" | "weekly" | null;
    special_key?: string | null;
    created_at?: string;
  },
) {
  const { error } = await supabaseAdmin().from("moments").insert({
    user_id: userId,
    created_at: data.created_at ?? new Date().toISOString(),
    category: data.category,
    prompt_name: data.prompt_name,
    mood_value: data.mood_value ?? null,
    card_type: "moment",
    special_type: data.special_type ?? null,
    special_key: data.special_key ?? null,
  });
  if (error) throw error;
}

export async function deletePromptByTitle(title: string) {
  const { error } = await supabaseAdmin().from("prompts").delete().eq("title", title);
  if (error) throw error;
}

export async function cleanupUserData(userId: string) {
  await supabaseAdmin().from("moments").delete().eq("user_id", userId);
  await supabaseAdmin().from("sessions").delete().eq("user_id", userId);
  await supabaseAdmin().from("wrap_ups").delete().eq("user_id", userId);
  await supabaseAdmin().from("profiles").delete().eq("id", userId);
}

export async function deleteUserById(userId: string) {
  await cleanupUserData(userId);
  const { error } = await supabaseAdmin().auth.admin.deleteUser(userId);
  if (error) throw error;
}

async function generateAuthLink(email: string, type: "magiclink" | "signup") {
  const env = getE2EEnv();
  const { data, error } = await supabaseAdmin().auth.admin.generateLink({
    type,
    email,
    options: {
      redirectTo: `${env.appBaseUrl}/auth/callback`,
    },
  });
  if (error) throw error;
  if (!data.properties?.action_link) {
    throw new Error(`No action link returned for ${type}.`);
  }
  return data.properties.action_link;
}

export async function signInWithMagicLink(page: Page, email: string) {
  const user = await ensureUser(email);
  const link = await generateAuthLink(email, "magiclink");
  await page.goto(link);
  await page.waitForURL(/\/(dashboard|onboarding|session)/, { timeout: 15_000 });
  return user;
}

export async function completeSignupFromEmailLink(page: Page, email: string) {
  const signupLink = await generateAuthLink(email, "signup");
  await page.goto(signupLink);
  await page.waitForURL(/\/onboarding/, { timeout: 15_000 });
  const user = await findUserByEmail(email);
  expect(user).toBeTruthy();
  return user as User;
}
