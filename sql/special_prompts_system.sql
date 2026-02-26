-- Seasonal + recurring special prompts for Tiny Pauses
-- Run in Supabase SQL editor.

alter table public.moments
  add column if not exists special_type text null,
  add column if not exists special_key text null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'moments_special_type_check'
  ) then
    alter table public.moments
      add constraint moments_special_type_check
      check (special_type is null or special_type in ('seasonal', 'weekly'));
  end if;
end $$;

create table if not exists public.seasonal_windows (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  start_date date not null, -- month/day interpreted in app local time using current year
  end_date date not null,   -- month/day interpreted in app local time using current year
  accent_color text not null,
  badge_label text not null,
  nudge_copy text not null,
  active boolean not null default true
);

create table if not exists public.special_prompts (
  id uuid primary key default gen_random_uuid(),
  special_type text not null check (special_type in ('seasonal', 'weekly')),
  special_key text not null,
  seasonal_window_key text null references public.seasonal_windows(key) on delete cascade,
  name text not null,
  body text not null,
  tiny_step text not null,
  rotation_order integer null,
  status text not null default 'active' check (status in ('active', 'inactive', 'draft')),
  internal_notes text null,
  created_at timestamptz not null default now()
);

create index if not exists special_prompts_lookup_idx
  on public.special_prompts (special_type, special_key, status, rotation_order);

alter table public.special_prompts enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'special_prompts'
      and policyname = 'Allow read special prompts'
  ) then
    create policy "Allow read special prompts"
      on public.special_prompts
      for select
      using (true);
  end if;
end $$;

alter table public.seasonal_windows enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'seasonal_windows'
      and policyname = 'Allow read seasonal windows'
  ) then
    create policy "Allow read seasonal windows"
      on public.seasonal_windows
      for select
      using (true);
  end if;
end $$;

insert into public.seasonal_windows
  (key, name, start_date, end_date, accent_color, badge_label, nudge_copy, active)
values
  ('back-to-school', 'Back to School', date '2000-09-01', date '2000-09-14', '#f4c447', 'Back to school', 'Something a little different for the start of the year.', true),
  ('halloween', 'Halloween', date '2000-10-24', date '2000-10-31', '#f3a35f', 'Halloween', 'A tiny pause for a big feeling kind of day.', true),
  ('thanksgiving-week', 'Thanksgiving Week', date '2000-11-20', date '2000-11-30', '#e1a94d', 'Thanksgiving week', 'Something gentle for a full week.', true),
  ('holiday-season', 'Holiday Season', date '2000-12-20', date '2000-12-31', '#56b7b3', 'Holiday season', 'Even the best times of year can be a lot.', true),
  ('valentines-day', 'Valentine''s Day', date '2000-02-10', date '2000-02-14', '#e8a8c8', 'Valentine''s Day', 'A tiny pause that is just for you today.', true),
  ('end-of-school-year', 'End of School Year', date '2000-06-01', date '2000-06-15', '#8bcf8e', 'End of school year', 'You made it. Here is something to mark that.', true)
on conflict (key) do update
set
  name = excluded.name,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  accent_color = excluded.accent_color,
  badge_label = excluded.badge_label,
  nudge_copy = excluded.nudge_copy,
  active = excluded.active;

insert into public.special_prompts
  (special_type, special_key, seasonal_window_key, name, body, tiny_step, rotation_order, status)
values
  ('seasonal', 'back-to-school', 'back-to-school', 'Fresh Page', 'Think about one thing you are actually looking forward to this year, even something tiny.', 'Take one slow breath and let that thing feel real for a moment.', 1, 'active'),
  ('seasonal', 'back-to-school', 'back-to-school', 'New Start Breath', 'A new school year means nothing from last year has to follow you in.', 'Breathe out slowly and picture last year staying outside the door.', 2, 'active'),
  ('seasonal', 'back-to-school', 'back-to-school', 'First Week Jitters', 'Feeling nervous about something new is your brain paying attention. That is normal.', 'Press your feet into the floor three times and remind yourself: I have done new things before.', 3, 'active'),

  ('seasonal', 'halloween', 'halloween', 'Good Excited', 'Notice where the excitement is living in your body right now. Your chest? Your stomach?', 'Take three quick breaths in and one long breath out. Let some of that energy move through you.', 1, 'active'),
  ('seasonal', 'halloween', 'halloween', 'Lot Going On', 'Sometimes there is just a lot happening at once and your brain does not know where to look.', 'Find one still thing near you. Look at it for three slow breaths.', 2, 'active'),
  ('seasonal', 'halloween', 'halloween', 'After the Rush', 'The excitement is real but so is the tired that comes after it.', 'Let your shoulders drop. Take two slow breaths and let your body catch up.', 3, 'active'),

  ('seasonal', 'thanksgiving-week', 'thanksgiving-week', 'Big Table', 'Family time can be wonderful and also a lot. Both things can be true at once.', 'Take a breath and give yourself permission to feel however you actually feel.', 1, 'active'),
  ('seasonal', 'thanksgiving-week', 'thanksgiving-week', 'One Good Thing', 'Find one small thing from today that felt good, even if the rest was complicated.', 'Hold that one thing in your mind for three slow breaths.', 2, 'active'),
  ('seasonal', 'thanksgiving-week', 'thanksgiving-week', 'Grateful Without Pressure', 'You do not have to feel grateful for everything. But there might be one small thing.', 'Name it quietly to yourself and take one steady breath.', 3, 'active'),

  ('seasonal', 'holiday-season', 'holiday-season', 'Too Much Good Stuff', 'Even good things can be overwhelming when there is too much at once.', 'Find somewhere quiet for one minute. Take three slow breaths and let the noise stay outside.', 1, 'active'),
  ('seasonal', 'holiday-season', 'holiday-season', 'Holiday Feelings', 'This time of year brings up a lot of feelings, sometimes ones that do not make sense together.', 'Take a breath and remind yourself: feelings do not have to make sense to be real.', 2, 'active'),
  ('seasonal', 'holiday-season', 'holiday-season', 'Almost There', 'The end of the year is a lot to hold. You made it through another one.', 'Take three slow breaths and let that land for a moment.', 3, 'active'),

  ('seasonal', 'valentines-day', 'valentines-day', 'All Kinds of Love', 'Valentine''s Day is about all the people who matter to you, not just one kind of relationship.', 'Think of one person who makes your life a little better. Breathe out and send them a quiet thank you.', 1, 'active'),
  ('seasonal', 'valentines-day', 'valentines-day', 'You Belong', 'Everybody belongs somewhere. Sometimes it just takes a minute to remember where that is for you.', 'Think of one place or one person where you feel like yourself. Take two slow breaths and sit with that.', 2, 'active'),
  ('seasonal', 'valentines-day', 'valentines-day', 'Be Kind to You', 'Today is a good day to turn some kindness toward yourself too.', 'Say quietly: I am doing okay. Take one slow breath and let yourself believe it.', 3, 'active'),

  ('seasonal', 'end-of-school-year', 'end-of-school-year', 'Made It', 'You made it through another year. That is more than it sounds like.', 'Take a slow breath and let yourself feel that for a moment. You did that.', 1, 'active'),
  ('seasonal', 'end-of-school-year', 'end-of-school-year', 'See You Later', 'Saying goodbye to people and places, even temporarily, brings up real feelings.', 'Think of one person you will miss. Breathe out slowly and wish them a good summer.', 2, 'active'),
  ('seasonal', 'end-of-school-year', 'end-of-school-year', 'What Is Next', 'Change can feel exciting and scary at the same time. That is completely normal.', 'Press your feet into the floor, take three slow breaths, and remind yourself: I handle new things.', 3, 'active'),

  ('weekly', 'sunday-evening', null, 'The Sunday Feeling', 'That low feeling Sunday evenings sometimes bring is real and you are not the only one who gets it.', 'Take three slow breaths and remind yourself: tonight is still tonight. Tomorrow is not here yet.', 1, 'active'),
  ('weekly', 'sunday-evening', null, 'Set It Down', 'Whatever is waiting for you this week does not have to be carried tonight.', 'Imagine setting the week ahead down beside you like a bag. Take two slow breaths. It will still be there tomorrow.', 2, 'active'),
  ('weekly', 'sunday-evening', null, 'Still Sunday', 'Sunday evening is still yours. The week has not started yet.', 'Notice one thing that feels good right now, even something small. Take three slow breaths and stay there for a moment.', 3, 'active'),
  ('weekly', 'sunday-evening', null, 'Ready Enough', 'You do not have to feel ready for the week. Ready enough is enough.', 'Take one slow breath in. On the way out, say quietly: I have done Mondays before.', 4, 'active'),

  ('weekly', 'monday-morning', null, 'Monday, Am I Right', 'Mondays ask a lot. It is okay to notice that before you do anything else.', 'Take three slow breaths before the day gets going. That is yours and nobody can take it back.', 1, 'active'),
  ('weekly', 'monday-morning', null, 'Slow Start', 'You do not have to be fully on yet. The week can wait one more minute.', 'Press your feet into the floor, take two slow breaths, and pick one small thing to focus on first.', 2, 'active'),
  ('weekly', 'monday-morning', null, 'New Week', 'Whatever last week was, this one is different. You get to start again.', 'Take one slow breath and picture last week staying behind you where it belongs.', 3, 'active'),
  ('weekly', 'monday-morning', null, 'One Thing', 'You do not have to think about the whole week. Just the next thing.', 'Name one thing you want to do today, even something tiny. Take a breath and start there.', 4, 'active')
on conflict do nothing;
