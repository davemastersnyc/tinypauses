-- Tiny Pause moments + wrap-ups schema
-- Run this in Supabase SQL editor.

create extension if not exists pgcrypto;
create extension if not exists pg_cron;

create table if not exists public.moments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  category text not null,
  prompt_name text not null,
  mood_value integer null check (mood_value between 1 and 5),
  card_type text not null default 'moment'
);

create index if not exists moments_user_created_idx
  on public.moments (user_id, created_at desc);

alter table public.moments enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'moments' and policyname = 'Users can read own moments'
  ) then
    create policy "Users can read own moments"
      on public.moments for select
      using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'moments' and policyname = 'Users can insert own moments'
  ) then
    create policy "Users can insert own moments"
      on public.moments for insert
      with check (auth.uid() = user_id);
  end if;
end $$;

create table if not exists public.wrap_ups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_type text not null check (period_type in ('weekly', 'monthly', 'yearly')),
  period_start date not null,
  stats jsonb not null,
  created_at timestamptz not null default now()
);

create unique index if not exists wrap_ups_unique_period
  on public.wrap_ups (user_id, period_type, period_start);

alter table public.wrap_ups enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'wrap_ups' and policyname = 'Users can read own wrap ups'
  ) then
    create policy "Users can read own wrap ups"
      on public.wrap_ups for select
      using (auth.uid() = user_id);
  end if;
end $$;

create or replace function public.wrap_up_closing_line(total_moments integer)
returns text
language sql
immutable
as $$
  select case
    when total_moments <= 1 then 'One pause is one more than none.'
    when total_moments <= 3 then 'A few quiet moments this week.'
    when total_moments <= 5 then 'A really present week.'
    else 'You showed up every single day this week.'
  end;
$$;

create or replace function public.wrap_up_mood_descriptor(avg_mood numeric)
returns text
language sql
immutable
as $$
  select case
    when avg_mood is null then 'A mixed time. That''s honest.'
    when avg_mood < 2 then 'A tough stretch. You still showed up.'
    when avg_mood < 3 then 'A mixed time. That''s honest.'
    when avg_mood <= 4 then 'A pretty good run overall.'
    else 'A really good stretch.'
  end;
$$;

create or replace function public.generate_wrap_up_for_period(
  p_user_id uuid,
  p_period_type text,
  p_period_start date,
  p_period_end date
)
returns void
language plpgsql
security definer
as $$
declare
  v_total_moments integer;
  v_total_days_with_moments integer;
  v_brain_break_count integer;
  v_top_category text;
  v_mood_average numeric;
  v_mood_descriptor text;
  v_best_month text;
  v_brain_break_day_name text;
  v_brain_break_year_note text;
  v_brain_break_month_counts jsonb;
  v_closing_line text;
  v_day_flags jsonb;
  v_month_day_flags jsonb;
  v_week_flags jsonb;
  v_threshold integer;
begin
  select count(*)::int
  into v_total_moments
  from public.moments m
  where m.user_id = p_user_id
    and m.created_at >= p_period_start::timestamptz
    and m.created_at < (p_period_end + 1)::timestamptz;

  select count(*)::int
  into v_brain_break_count
  from public.moments m
  where m.user_id = p_user_id
    and m.created_at >= p_period_start::timestamptz
    and m.created_at < (p_period_end + 1)::timestamptz
    and lower(trim(m.category)) in ('brain-break', 'brain break');

  if p_period_type = 'weekly' then
    v_threshold := 1;
  elsif p_period_type = 'monthly' then
    v_threshold := 3;
  else
    v_threshold := 10;
  end if;

  if v_total_moments < v_threshold then
    return;
  end if;

  select count(distinct (m.created_at at time zone 'utc')::date)::int
  into v_total_days_with_moments
  from public.moments m
  where m.user_id = p_user_id
    and m.created_at >= p_period_start::timestamptz
    and m.created_at < (p_period_end + 1)::timestamptz;

  select m.category
  into v_top_category
  from public.moments m
  where m.user_id = p_user_id
    and m.created_at >= p_period_start::timestamptz
    and m.created_at < (p_period_end + 1)::timestamptz
    and lower(trim(m.category)) not in ('brain-break', 'brain break')
  group by m.category
  order by count(*) desc, min(m.created_at) asc
  limit 1;

  select avg(m.mood_value)::numeric(10,2)
  into v_mood_average
  from public.moments m
  where m.user_id = p_user_id
    and m.created_at >= p_period_start::timestamptz
    and m.created_at < (p_period_end + 1)::timestamptz
    and m.mood_value is not null;

  v_mood_descriptor := public.wrap_up_mood_descriptor(v_mood_average);
  if p_period_type = 'weekly' then
    v_closing_line := public.wrap_up_closing_line(v_total_moments);
  end if;

  if p_period_type = 'yearly' then
    select to_char(date_trunc('month', m.created_at), 'FMMonth')
    into v_best_month
    from public.moments m
    where m.user_id = p_user_id
      and m.created_at >= p_period_start::timestamptz
      and m.created_at < (p_period_end + 1)::timestamptz
    group by date_trunc('month', m.created_at)
    order by count(*) desc, min(m.created_at) asc
    limit 1;
  end if;

  if p_period_type = 'monthly' and v_brain_break_count > 0 then
    with weekday_counts as (
      select
        extract(isodow from m.created_at at time zone 'utc')::int as iso_dow,
        count(*)::int as total
      from public.moments m
      where m.user_id = p_user_id
        and m.created_at >= p_period_start::timestamptz
        and m.created_at < (p_period_end + 1)::timestamptz
        and lower(trim(m.category)) in ('brain-break', 'brain break')
      group by 1
      having count(*) > 2
      order by total desc, iso_dow asc
      limit 1
    )
    select case iso_dow
      when 1 then 'Monday'
      when 2 then 'Tuesday'
      when 3 then 'Wednesday'
      when 4 then 'Thursday'
      when 5 then 'Friday'
      when 6 then 'Saturday'
      when 7 then 'Sunday'
      else null
    end
    into v_brain_break_day_name
    from weekday_counts;
  end if;

  if p_period_type = 'yearly' then
    select coalesce(
      jsonb_agg(
        coalesce(month_counts.total, 0)
        order by months.month_num
      ),
      '[]'::jsonb
    )
    into v_brain_break_month_counts
    from (
      select generate_series(1, 12) as month_num
    ) months
    left join (
      select
        extract(month from m.created_at at time zone 'utc')::int as month_num,
        count(*)::int as total
      from public.moments m
      where m.user_id = p_user_id
        and m.created_at >= p_period_start::timestamptz
        and m.created_at < (p_period_end + 1)::timestamptz
        and lower(trim(m.category)) in ('brain-break', 'brain break')
      group by 1
    ) month_counts
      on month_counts.month_num = months.month_num;

    if v_total_moments > 0 and (v_brain_break_count::numeric / v_total_moments::numeric) > 0.20 then
      v_brain_break_year_note := 'Brain breaks were a big part of your year. You knew what you needed.';
    elsif v_total_moments > 0 and (v_brain_break_count::numeric / v_total_moments::numeric) < 0.05 then
      v_brain_break_year_note := format('You tried a brain break %s %s this year.', v_brain_break_count, case when v_brain_break_count = 1 then 'time' else 'times' end);
    else
      v_brain_break_year_note := format('You slowed your brain down %s %s this year.', v_brain_break_count, case when v_brain_break_count = 1 then 'time' else 'times' end);
    end if;
  end if;

  if p_period_type = 'weekly' then
    select coalesce(
      jsonb_agg(
        exists(
          select 1
          from public.moments m
          where m.user_id = p_user_id
            and (m.created_at at time zone 'utc')::date = g.day
        )
        order by g.day
      ),
      '[]'::jsonb
    )
    into v_day_flags
    from (
      select generate_series(p_period_start, p_period_end, '1 day'::interval)::date as day
    ) g;
  end if;

  if p_period_type = 'monthly' then
    select coalesce(
      jsonb_agg(
        exists(
          select 1
          from public.moments m
          where m.user_id = p_user_id
            and (m.created_at at time zone 'utc')::date = g.day
        )
        order by g.day
      ),
      '[]'::jsonb
    )
    into v_month_day_flags
    from (
      select generate_series(p_period_start, p_period_end, '1 day'::interval)::date as day
    ) g;
  end if;

  if p_period_type = 'yearly' then
    select coalesce(
      jsonb_agg(
        exists(
          select 1
          from public.moments m
          where m.user_id = p_user_id
            and (m.created_at at time zone 'utc')::date >= week_start
            and (m.created_at at time zone 'utc')::date <= least(week_start + 6, p_period_end)
        )
        order by week_start
      ),
      '[]'::jsonb
    )
    into v_week_flags
    from (
      select (p_period_start + (n * 7))::date as week_start
      from generate_series(0, 51) n
    ) w;
  end if;

  insert into public.wrap_ups (
    user_id,
    period_type,
    period_start,
    stats
  )
  values (
    p_user_id,
    p_period_type,
    p_period_start,
    jsonb_build_object(
      'total_moments', v_total_moments,
      'total_days_with_moments', v_total_days_with_moments,
      'brain_break_count', v_brain_break_count,
      'top_category', v_top_category,
      'mood_average', v_mood_average,
      'mood_descriptor', v_mood_descriptor,
      'best_month', v_best_month,
      'brain_break_day_name', v_brain_break_day_name,
      'brain_break_year_note', v_brain_break_year_note,
      'brain_break_month_counts', v_brain_break_month_counts,
      'closing_line', v_closing_line,
      'day_flags', v_day_flags,
      'month_day_flags', v_month_day_flags,
      'week_flags', v_week_flags
    )
  )
  on conflict (user_id, period_type, period_start) do nothing;
end;
$$;

create or replace function public.generate_wrap_ups_utc()
returns void
language plpgsql
security definer
as $$
declare
  v_week_start date := date_trunc('week', (now() at time zone 'utc')::date - 1)::date;
  v_week_end date := v_week_start + 6;
  v_month_start date := date_trunc('month', (now() at time zone 'utc')::date - interval '1 month')::date;
  v_month_end date := (date_trunc('month', (now() at time zone 'utc')::date)::date - 1);
  v_year_start date := make_date(extract(year from now() at time zone 'utc')::int - 1, 1, 1);
  v_year_end date := make_date(extract(year from now() at time zone 'utc')::int - 1, 12, 31);
  r record;
begin
  for r in
    select distinct user_id
    from public.moments
    where created_at >= least(v_year_start::timestamptz, v_month_start::timestamptz, v_week_start::timestamptz)
  loop
    perform public.generate_wrap_up_for_period(r.user_id, 'weekly', v_week_start, v_week_end);
    perform public.generate_wrap_up_for_period(r.user_id, 'monthly', v_month_start, v_month_end);
    perform public.generate_wrap_up_for_period(r.user_id, 'yearly', v_year_start, v_year_end);
  end loop;
end;
$$;

-- Schedules (UTC). Run once after creating this script.
select cron.schedule(
  'tiny_pause_wrapup_weekly',
  '0 20 * * 0',
  $$select public.generate_wrap_ups_utc();$$
);

select cron.schedule(
  'tiny_pause_wrapup_monthly',
  '15 0 1 * *',
  $$select public.generate_wrap_ups_utc();$$
);

select cron.schedule(
  'tiny_pause_wrapup_yearly',
  '30 0 1 1 *',
  $$select public.generate_wrap_ups_utc();$$
);
