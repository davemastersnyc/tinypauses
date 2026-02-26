# Tiny Pauses

Tiny Pauses is a Next.js app for short guided mindful moments with optional sign-in, progress tracking, and shareable cards.

## Local development

1. Install dependencies:
   - `npm install`
2. Start dev server:
   - `npm run dev`
3. Open:
   - `http://localhost:3000`

Core app code lives in:
- `src/app`
- `src/lib`

## Environment variables

Set these in your local env and deployment env:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ADMIN_EMAIL` (for `/admin` access check)

## Supabase setup

Run these SQL files in Supabase SQL Editor:

1. Prompt seed data:
   - `sql/seed_prompts_40.sql`
2. Prompt admin fields + brain break steps:
   - `sql/admin_prompt_management.sql`
3. Profile onboarding fields:
   - `sql/profile_onboarding_fields.sql`
4. Moments + wrap-ups schema/functions/cron:
   - `sql/moments_and_wrapups.sql`
5. Seasonal + weekly special prompts:
   - `sql/special_prompts_system.sql`

Prompt seed behavior (`sql/seed_prompts_40.sql`):
- Idempotent (safe to re-run).
- Upserts the curated prompt set (44 active prompts total: 11 per kind).
- Deactivates retired/non-curated prompts for `pause`, `letting-go`, `reflect`, and `kindness`.

Special prompts behavior (`sql/special_prompts_system.sql`):
- Idempotent (safe to re-run).
- Adds `moments.special_type` and `moments.special_key` for special-session tracking.
- Creates `seasonal_windows` and `special_prompts`.
- Seeds:
  - Seasonal windows: back-to-school, halloween, thanksgiving-week, holiday-season, valentines-day, end-of-school-year.
  - Weekly windows: sunday-evening and monday-morning prompt pools.

## Special prompts runtime

- Dashboard computes one active special nudge at a time:
  - Seasonal first (if currently in an active window).
  - Weekly fallback:
    - Sunday evening: 5pm to 11:59pm local time.
    - Monday morning: 5am to 11:59am local time.
- Nudge dismissal is stored in local storage for 24 hours per special key.
- Session supports deep links from dashboard (`/session?specialType=...&specialKey=...&promptId=...`).
- Completing a special session writes `special_type` and `special_key` to `moments`.
- Sharing rules:
  - Seasonal special moments are shareable.
  - Weekly special moments are intentionally non-shareable.

## Admin panel

`/admin` now includes:
- `Prompts` (base prompt library)
- `Seasonal Prompts` (window activation + seasonal prompt management)
- `Weekly Prompts` (weekly prompt management + rotation order)
- `Brain Break Steps`
- `Stats`

### Quick verification

After running schema SQL:

```sql
select
  to_regclass('public.moments') as moments_table,
  to_regclass('public.wrap_ups') as wrapups_table;
```

Expected:
- `public.moments`
- `public.wrap_ups`

After running special prompts SQL:

```sql
select
  to_regclass('public.seasonal_windows') as seasonal_windows_table,
  to_regclass('public.special_prompts') as special_prompts_table;
```

Expected:
- `public.seasonal_windows`
- `public.special_prompts`

```sql
select special_type, special_key, count(*) as prompt_count
from public.special_prompts
where status = 'active'
group by special_type, special_key
order by special_type, special_key;
```

Expected:
- Seasonal keys each have active prompts.
- Weekly keys include `sunday-evening` and `monday-morning`.

After running prompt seed SQL:

```sql
select kind, count(*) filter (where is_active) as active_count
from prompts
where kind in ('pause', 'letting-go', 'reflect', 'kindness')
group by kind
order by kind;
```

Expected:
- `pause`: 11
- `letting-go`: 11
- `reflect`: 11
- `kindness`: 11

## Notes

- Card images are generated client-side with Canvas and are **not** stored in Supabase Storage.
- Dashboard supports fallback from `moments` metadata to legacy `sessions` if needed during rollout.
- The app is currently forced to light mode (system dark mode is intentionally ignored).
