-- Parent onboarding profile fields for Tiny Pauses
-- Run in Supabase SQL editor.

alter table public.profiles
  add column if not exists child_name text null,
  add column if not exists anchor_moment text null,
  add column if not exists onboarding_complete boolean not null default false,
  add column if not exists onboarding_skipped boolean not null default false,
  add column if not exists adult_mode boolean not null default false;
