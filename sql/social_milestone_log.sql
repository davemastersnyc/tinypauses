create extension if not exists pgcrypto;

-- Records each growth milestone that has triggered a social celebration post,
-- so the weekly Instagram generator fires each milestone only once.
create table if not exists public.social_milestone_log (
  id uuid primary key default gen_random_uuid(),
  milestone_kind text not null check (milestone_kind in ('pauses', 'subscribers')),
  threshold integer not null check (threshold > 0),
  posted_at timestamptz not null default now(),
  unique (milestone_kind, threshold)
);

alter table public.social_milestone_log enable row level security;

-- No public policies are defined. Service role can access via bypass RLS.
