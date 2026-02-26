-- Admin prompt management schema updates for Tiny Pauses
-- Run in Supabase SQL editor.

alter table public.prompts
  add column if not exists status text,
  add column if not exists internal_notes text,
  add column if not exists created_at timestamptz not null default now();

update public.prompts
set status = case
  when is_active is true then 'active'
  else 'inactive'
end
where status is null;

update public.prompts
set status = 'active'
where status not in ('active', 'inactive', 'draft') or status is null;

alter table public.prompts
  alter column status set default 'active';

create table if not exists public.brain_break_steps (
  id uuid primary key default gen_random_uuid(),
  step_number integer not null unique check (step_number between 1 and 6),
  instruction text not null,
  updated_at timestamptz not null default now()
);

insert into public.brain_break_steps (step_number, instruction)
values
  (1, 'Shake your hands like you''re flicking water off them. Arms too if you want.'),
  (2, 'Stomp your feet three times. Then press them flat into the floor and hold.'),
  (3, 'Make your hands into fists. Squeeze hard for three seconds. Then let go completely.'),
  (4, 'Touch something near you. Notice if it feels cool or warm. Just notice.'),
  (5, 'Breathe in slowly through your nose. Out through your mouth. Do that three times.'),
  (6, 'Your brain slowed down. You did that.')
on conflict (step_number) do nothing;

alter table public.brain_break_steps enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'brain_break_steps'
      and policyname = 'Allow read brain break steps'
  ) then
    create policy "Allow read brain break steps"
      on public.brain_break_steps
      for select
      using (true);
  end if;
end $$;
