import type { SupabaseClient } from "@supabase/supabase-js";

export type FavoritePrompt = {
  id: string;
  sourceId: string | null;
  kind: string | null;
  title: string;
  body: string;
  step: string;
  createdAt: string;
};

export type FavoriteInput = {
  id: string | null;
  kind: string | null;
  title: string;
  body: string;
  step: string;
};

type FavoriteRow = {
  id: string;
  source_id: string | null;
  kind: string | null;
  title: string;
  body: string;
  step: string;
  created_at: string;
};

const LEGACY_LOCAL_KEYS = [
  "tinyPause.favoritePrompts",
  "practice.favoritePrompts",
];

const SELECT_COLUMNS = "id, source_id, kind, title, body, step, created_at";

function mapRow(row: FavoriteRow): FavoritePrompt {
  return {
    id: row.id,
    sourceId: row.source_id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    step: row.step,
    createdAt: row.created_at,
  };
}

export async function listFavorites(
  client: SupabaseClient,
  userId: string,
): Promise<FavoritePrompt[]> {
  const { data, error } = await client
    .from("favorite_prompts")
    .select(SELECT_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data as FavoriteRow[]) ?? []).map(mapRow);
}

export async function getFavorite(
  client: SupabaseClient,
  userId: string,
  id: string,
): Promise<FavoritePrompt | null> {
  const { data, error } = await client
    .from("favorite_prompts")
    .select(SELECT_COLUMNS)
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data as FavoriteRow) : null;
}

export async function saveFavorite(
  client: SupabaseClient,
  userId: string,
  prompt: FavoriteInput,
): Promise<void> {
  const { error } = await client.from("favorite_prompts").upsert(
    {
      user_id: userId,
      source_id: prompt.id,
      kind: prompt.kind,
      title: prompt.title,
      body: prompt.body,
      step: prompt.step,
    },
    { onConflict: "user_id,source_id", ignoreDuplicates: true },
  );
  if (error) throw error;
}

export async function removeFavorite(
  client: SupabaseClient,
  userId: string,
  id: string,
): Promise<void> {
  const { error } = await client
    .from("favorite_prompts")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);
  if (error) throw error;
}

// One-time lift of any pre-existing localStorage favorites into the account,
// then clears the local copies so this is idempotent.
export async function migrateLocalFavorites(
  client: SupabaseClient,
  userId: string,
): Promise<void> {
  if (typeof window === "undefined") return;

  let raw: string | null = null;
  for (const key of LEGACY_LOCAL_KEYS) {
    raw = window.localStorage.getItem(key);
    if (raw) break;
  }
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw) as Array<Partial<FavoriteInput>>;
    const rows = parsed
      .filter((item) => item.title && item.body && item.step)
      .map((item) => ({
        user_id: userId,
        source_id: item.id ?? null,
        kind: item.kind ?? null,
        title: item.title as string,
        body: item.body as string,
        step: item.step as string,
      }));

    if (rows.length) {
      const { error } = await client
        .from("favorite_prompts")
        .upsert(rows, { onConflict: "user_id,source_id", ignoreDuplicates: true });
      if (error) throw error;
    }

    for (const key of LEGACY_LOCAL_KEYS) {
      window.localStorage.removeItem(key);
    }
  } catch (error) {
    console.error("Could not migrate local favorites", error);
  }
}
