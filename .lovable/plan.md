

# Email Campaign Audit and High-Conversion Improvement Plan

## Current State Audit

### What exists today

| Email Type | Template | Trigger | Emails Sent |
|---|---|---|---|
| Welcome | `welcome` | Instant on signup (DB trigger) | 27 |
| Onboarding Day 2 | `onboarding_day2` | Cron (9 AM UTC daily) | 18 |
| Onboarding Day 5 | `onboarding_day5` | Cron | 11 |
| Onboarding Day 7 | `onboarding_day7` | Cron (upsell to Pro) | 11 |
| Trial Started | `trial_started` | On trial activation | 7 |
| Trial Ending | `trial_ending` | 2 days before expiry | 1 |
| Trial Expired | `trial_expired` | On expiry | 1 |
| Streak at Risk | `streak_at_risk` | Cron (10 AM UTC) | 1 |
| Streak Lost | `streak_lost` | Not triggered by cron | 1 |
| Weekly Progress | `weekly_progress` | Sundays (engagement cron) | 0 |
| Reactivation | `reactivation` | 14-21 days inactive | 0 |
| Subscription Welcome | `subscription_welcome` | On payment verification | 0 |
| Subscription Expiring | `subscription_expiring` | 3 days before expiry | 0 |
| Subscription Expired | `subscription_expired` | On expiry | 0 |
| **Abandoned Checkout** | **None** | **Not implemented** | **N/A** |

### Key stats
- 31 total users, 6 on trial, 6 Pro subscribers, 0 Team subscribers
- 27 welcome emails sent but only 18 got Day 2 (33% drop-off -- likely timing/cron issue)
- Only 11 got Day 5 and Day 7 (59% drop from welcome)
- 7 trials started but 0 paid conversions tracked via email
- 1 pending abandoned checkout already in the `payment_attempts` table
- **Zero** reactivation, weekly progress, or subscription lifecycle emails sent yet

### Identified Gaps

1. **No abandoned checkout email** -- You just built `payment_attempts` tracking, but no automated email follows up on abandoned checkouts
2. **No trial-to-paid nudge sequence** -- Only 1 email at Day 5 (2 days before expiry). No Day 1, Day 3, or Day 6 trial nudge emails
3. **No post-purchase engagement** -- After subscribing, no "here's how to get the most out of Pro" drip
4. **Reactivation is too late** -- Only triggers at 14 days inactive. A 3-day and 7-day nudge would catch users before they fully churn
5. **No personalization** -- Emails don't reference what the user has actually done (e.g., "You uploaded 3 materials but haven't tried flashcards yet")
6. **Missing "streak lost" trigger** -- Template exists but the engagement cron never fires it
7. **No A/B subject line testing** or open/click tracking beyond Resend's built-in

---

## Improvement Plan

### Phase 1: Abandoned Checkout Recovery Email (High Impact)

**New template**: `abandoned_checkout`

Trigger: Users in `payment_attempts` with `status = 'pending'` and `created_at > 1 hour ago`.

**Implementation:**
- Add `abandoned_checkout` template to `send-email/index.ts` with urgency copy + direct payment link
- Add abandoned checkout processing to `email-engagement/index.ts` cron job
- Query `payment_attempts` for pending rows older than 1 hour, send email with plan details and a "Complete your purchase" CTA
- Send a second follow-up at 24 hours if still pending
- Mark attempts as `abandoned` after 72 hours (for clean reporting)

### Phase 2: Enhanced Trial Conversion Sequence

Currently only 1 email during the trial (at Day 5). Add more touchpoints:

| Day | Template | Subject Line | Focus |
|---|---|---|---|
| 0 | `trial_started` (exists) | "Welcome to your 7-day Pro trial!" | Feature overview |
| 1 | `trial_day1` (new) | "Here's what to try first on your Pro trial" | Quick-win tutorial |
| 3 | `trial_day3` (new) | "You're halfway through your trial -- how's it going?" | Social proof + usage stats |
| 5 | `trial_ending` (exists, move to Day 5) | "Your Pro trial ends in 2 days" | Urgency + loss aversion |
| 7 | `trial_expired` (exists) | "Your access has been paused" | Final CTA with limited-time offer |

### Phase 3: Early Churn Prevention

Add earlier re-engagement before the current 14-day reactivation:

| Trigger | Template | Subject |
|---|---|---|
| 3 days inactive | `nudge_3day` (new) | "Quick 5-min session? Your materials are waiting" |
| 7 days inactive | `nudge_7day` (new) | "We saved your progress -- come back anytime" |
| 14 days inactive | `reactivation` (exists) | "We miss you! Come back and study" |

### Phase 4: Fix "Streak Lost" Trigger

The `streak_lost` template exists but is never triggered by the engagement cron. Add logic to detect users whose `streak_days` was reset to 0 and `last_study_date` was within the last 48 hours (meaning they just lost it).

### Phase 5: Abandoned Checkout Status Cleanup

Add a periodic job (in the engagement cron) to mark `payment_attempts` as `abandoned` after 72 hours of being `pending`. This keeps reporting clean and prevents re-sending emails indefinitely.

---

## Technical Changes Summary

| File | Change |
|---|---|
| `supabase/functions/send-email/index.ts` | Add 4 new templates: `abandoned_checkout`, `trial_day1`, `trial_day3`, `nudge_3day`, `nudge_7day`. Add to type union and preference map. |
| `supabase/functions/email-engagement/index.ts` | Add 4 new cron sections: abandoned checkout (1hr + 24hr), early inactivity nudges (3-day, 7-day), streak lost detection, and payment_attempts cleanup (72hr to abandoned). |
| `supabase/functions/check-subscriptions/index.ts` | Move trial_ending reminder to Day 5 (currently Day 5 already). Add `trial_day1` and `trial_day3` sends. |

### No database changes needed
The existing `payment_attempts`, `email_logs`, `email_preferences`, and `profiles` tables support all of the above.

