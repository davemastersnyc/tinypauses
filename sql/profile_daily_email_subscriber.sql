alter table public.profiles
  add column if not exists daily_email_subscriber boolean not null default false;
