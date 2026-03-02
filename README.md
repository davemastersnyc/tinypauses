# Tiny Pauses

A mindfulness app for kids 9-12. And honestly, for their grown-ups too.

[tinypauses.com](https://tinypauses.com)

---

Two minutes. No writing. No talking. No streaks. No guilt.

Just a tiny pause -- a single prompt, one small action, and a moment to notice how you feel. That's it. The app is designed to end. There's no next video, no suggested content, nothing pulling you back in.

---

## Why it exists

Honestly? I needed it too.

I wanted something that would help my son and me actually slow down -- not a full meditation practice, not a journaling habit, just a genuine moment to pause and reset. Everything I found was either too much commitment, too childish, or too focused on adults. Nothing felt right for both of us.

So I built it.

My son is my best collaborator. Brain Break mode came directly from him -- he described what he does at school to help himself feel grounded when things get overwhelming. Movement first, pressure, then breath. I built what he described, looked it up, and found out it aligns closely with occupational therapy best practices. That felt like confirmation we were onto something real.

He still helps with feature ideas. The product is better for it.

---

## What's in it

- 44 prompts across 4 categories -- Just a Pause, Letting Go, Reflecting on Today, Kindness
- Brain Break -- a 6-step somatic regulation sequence for kids who aren't calm yet
- Mood check-in after each session
- A dashboard that keeps gentle track without pressure or streaks
- Seasonal and weekly special prompts
- Shareable moment cards
- Works for adults too -- the "I'm here for myself" path is real and intentional

---

## On privacy

No ads. No data selling. No engagement manipulation. Ever. The business model will never depend on any of those things. That's not a feature, it's just the only way this product makes sense to build.

---

## Built with

Next.js · Supabase · Tailwind · TypeScript · Vercel

Built by [Dave Masters](https://quietbrancheslabs.com)

---
---

## Developer docs

### Local development

1. Install dependencies:
   - `npm install`
2. Start dev server:
   - `npm run dev`
3. Open:
   - `http://localhost:3000`

Core app code lives in `src/app` and `src/lib`

### Environment variables

Set these in your local env and deployment env:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ADMIN_EMAIL` (for `/admin` access check)
- `SUPABASE_SERVICE_ROLE_KEY`
- `BREVO_API_KEY`
- `BREVO_DAILY_LIST_ID`
- `BREVO_TEST_LIST_ID` (safe manual test list)
- `CRON_SECRET`
- `DAILY_PROMPT_ENABLED` (`true`/`false` kill switch)
- `DAILY_PROMPT_MAX_RECIPIENTS` (hard cap per run, e.g. `50` or `250`)

### Supabase setup

Run these SQL files in Supabase SQL Editor in order:

1. `sql/seed_prompts_40.sql` -- prompt seed data
2. `sql/admin_prompt_management.sql` -- prompt admin fields and brain break steps
3. `sql/profile_onboarding_fields.sql` -- profile onboarding fields
4. `sql/moments_and_wrapups.sql` -- moments, wrap-ups schema, functions, cron
5. `sql/special_prompts_system.sql` -- seasonal and weekly special prompts

### Prompt seed behavior

- Idempotent (safe to re-run)
- Upserts the curated prompt set (44 active prompts: 11 per category)
- Deactivates retired prompts for pause, letting-go, reflect, and kindness

### Special prompts runtime

- Dashboard computes one active special nudge at a time
- Seasonal takes priority over weekly
- Weekly windows: Sunday evening 5pm-11:59pm, Monday morning 5am-11:59am local time
- Nudge dismissal stored in localStorage for 24 hours per special key
- Session supports deep links from dashboard (`/session?specialType=...&specialKey=...&promptId=...`)
- Seasonal special moments are shareable. Weekly are intentionally not.

### Daily prompt email safety harness

`/api/cron/daily-prompt` includes guardrails:

- One-recipient transactional sends only (no shared recipient list in a single send)
- `DAILY_PROMPT_ENABLED=false` disables all sends
- `DAILY_PROMPT_MAX_RECIPIENTS` blocks sends above a cap
- `dryRun` mode validates prompt and audience without sending
- `useTestList` mode sends manual override runs to `BREVO_TEST_LIST_ID`

Manual checks before production sends:

1. Dry run against test list (no email sent):

```bash
curl -L -sS -X POST "https://www.tinypauses.com/api/cron/daily-prompt" \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"override": true, "dryRun": true, "useTestList": true}'
```

Expected response includes:
- `ok: true`
- `dryRun: true`
- `listMode: "test"`

2. Real send to test list only:

```bash
curl -L -sS -X POST "https://www.tinypauses.com/api/cron/daily-prompt" \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"override": true, "useTestList": true}'
```

3. Scheduled production send:

- Vercel cron calls `GET /api/cron/daily-prompt`
- Always uses `BREVO_DAILY_LIST_ID` (production list)
- `useTestList` is only available through manual `POST` calls

### Admin panel

`/admin` includes:
- Prompts (base prompt library)
- Seasonal Prompts (window activation and management)
- Weekly Prompts (management and rotation order)
- Brain Break Steps
- Stats

### Quick verification

After running schema SQL:

```sql
select
  to_regclass('public.moments') as moments_table,
  to_regclass('public.wrap_ups') as wrapups_table;
```

After running special prompts SQL:

```sql
select
  to_regclass('public.seasonal_windows') as seasonal_windows_table,
  to_regclass('public.special_prompts') as special_prompts_table;
```

```sql
select special_type, special_key, count(*) as prompt_count
from public.special_prompts
where status = 'active'
group by special_type, special_key
order by special_type, special_key;
```

After running prompt seed SQL:

```sql
select kind, count(*) filter (where is_active) as active_count
from prompts
where kind in ('pause', 'letting-go', 'reflect', 'kindness')
group by kind
order by kind;
```

Expected: 11 active prompts per category.

### Notes

- Card images are generated client-side with Canvas and are not stored in Supabase Storage
- Dashboard supports fallback from `moments` metadata to legacy `sessions` if needed during rollout
- The app is currently forced to light mode (system dark mode is intentionally ignored)
