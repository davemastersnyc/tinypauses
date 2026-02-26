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

Prompt seed behavior (`sql/seed_prompts_40.sql`):
- Idempotent (safe to re-run).
- Upserts the curated prompt set (44 active prompts total: 11 per kind).
- Deactivates retired/non-curated prompts for `pause`, `letting-go`, `reflect`, and `kindness`.

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
