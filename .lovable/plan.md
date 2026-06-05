## Verification results

**profiles — PASS.** All columns the mobile contract lists exist: `full_name, avatar_url, study_goal, daily_study_minutes, preferred_study_time, notification_enabled, notification_prefs, subjects, onboarded_at, exam_date, experience_level, xp, level, streak_days, last_study_date, streak_freezes`. No action.

**realtime — PARTIAL PASS.** `public.group_messages` is in the `supabase_realtime` publication. `message_reactions`, `group_polls`, and `poll_votes` are not. The brief only requires `group_messages` live, so this is technically a pass — but reactions/polls won't update live for other clients. Flag for confirmation before adding.

**subscriptions — MISMATCH.** Existing columns: `plan, status, billing_interval, current_period_start, current_period_end, trial_start_date, trial_end_date, trial_used, cancelled_at, paystack_*`. Mobile contract expects to read `is_trial, trial_days_remaining, current_period_end, interval`. Three of those are missing or named differently:

| Mobile expects | Backend has | Action |
| --- | --- | --- |
| `current_period_end` | `current_period_end` | ✓ |
| `interval` | `billing_interval` | Rename mismatch |
| `is_trial` | derivable from `status = 'trial'` | Add |
| `trial_days_remaining` | derivable from `trial_end_date - now()` | Add |

## Plan

### 1. Add a compatibility view for the mobile app

Create `public.subscriptions_v` (security invoker, RLS inherited from the base table) exposing the exact column names the mobile app reads:

```sql
create or replace view public.subscriptions_v
with (security_invoker = true) as
select
  user_id,
  plan,
  status,
  billing_interval as interval,
  current_period_end,
  (status = 'trial') as is_trial,
  greatest(0, ceil(extract(epoch from (trial_end_date - now())) / 86400))::int
    as trial_days_remaining,
  trial_end_date,
  cancelled_at
from public.subscriptions;

grant select on public.subscriptions_v to authenticated;
```

Mobile points its subscription read at `subscriptions_v` instead of `subscriptions`. No data migration, no breakage of the Paystack writer.

### 2. Realtime publication — confirm scope

No change yet. Ask before adding `message_reactions` / `group_polls` / `poll_votes` to the publication, since the brief doesn't require them and broadcasting them has cost.

### 3. Document the column-name mapping

Update `mem://monetization/paystack-subscription-system` with the `interval ↔ billing_interval` and `is_trial / trial_days_remaining` derivation so future changes preserve them.

## Out of scope

- RevenueCat → `subscriptions` sync (web uses Paystack only; mobile-side concern unless we want a unified sync).
- Adding physical `is_trial` / `trial_days_remaining` columns — the view keeps a single source of truth.
