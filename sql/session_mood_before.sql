-- Add an optional "mood before" reading to sessions so we can measure the
-- shift across a tiny pause (paired with the existing mood_after).
-- Run this in the Supabase SQL editor. Safe to re-run.

alter table public.sessions
  add column if not exists mood_before integer
    check (mood_before between 1 and 5);
