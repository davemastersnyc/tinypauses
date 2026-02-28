create extension if not exists pgcrypto;

create table if not exists public.prompt_send_log (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references public.prompts(id),
  sent_at timestamptz not null default now(),
  send_type text not null check (send_type = 'daily_email')
);

alter table public.prompt_send_log enable row level security;

-- No public policies are defined. Service role can access via bypass RLS.
