create extension if not exists pgcrypto;

create table if not exists public.daily_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  subscribed_at timestamptz not null default now(),
  is_active boolean not null default true
);

alter table public.daily_subscribers enable row level security;

-- No public policies are defined. Service role can access via bypass RLS.
