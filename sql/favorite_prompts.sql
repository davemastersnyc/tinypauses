-- Account-backed favorite (saved) prompts. Replaces the old localStorage-only
-- favorites so saved prompts sync across a signed-in user's devices.
-- Run this in the Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.favorite_prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_id text,
  kind text,
  title text not null,
  body text not null,
  step text not null,
  created_at timestamptz not null default now(),
  unique (user_id, source_id)
);

create index if not exists favorite_prompts_user_created_idx
  on public.favorite_prompts (user_id, created_at desc);

alter table public.favorite_prompts enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'favorite_prompts' and policyname = 'Users can read own favorites'
  ) then
    create policy "Users can read own favorites"
      on public.favorite_prompts for select
      using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'favorite_prompts' and policyname = 'Users can insert own favorites'
  ) then
    create policy "Users can insert own favorites"
      on public.favorite_prompts for insert
      with check (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'favorite_prompts' and policyname = 'Users can delete own favorites'
  ) then
    create policy "Users can delete own favorites"
      on public.favorite_prompts for delete
      using (auth.uid() = user_id);
  end if;
end $$;
