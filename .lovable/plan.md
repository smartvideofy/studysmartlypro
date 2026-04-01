

# Reduce Trial to 3 Days + Optimized Email Drip

## Overview
Change the trial duration from 7 days to 3 days across all backend logic, database triggers, email templates, and UI components. Replace the existing drip sequence with a compressed Day 1 / Day 2 / Day 3 cadence.

## Changes

### 1. Database Migration — Update trigger
**File:** New migration SQL
- Change `handle_new_user_trial()` function: `now() + interval '7 days'` → `now() + interval '3 days'`

### 2. Paystack Edge Function — Trial start
**File:** `supabase/functions/paystack/index.ts`
- Line 549: `trialEnd.setDate(trialEnd.getDate() + 7)` → `+ 3`
- Line 601: Update message `'7 days'` → `'3 days'`

### 3. Check-Subscriptions Edge Function — Drip sequence
**File:** `supabase/functions/check-subscriptions/index.ts`
- Remove the existing `trial_day1` (1 day after start) and `trial_day3` (3 days after start) drip logic
- Replace with new compressed sequence:
  - **Day 1** (same day as start, ~6 hours after): Keep `trial_day1` but update copy to reflect "2 days left"
  - **Day 2** (1 day after start): New `trial_day2` — personalized stats + "last full day" urgency
  - **Day 3** (2 days after start): New `trial_day3` — final "expires today" push with discount offer
- Change the "trial ending" reminder from 2 days before expiry to 1 day before (since trial is only 3 days)

### 4. Send-Email Edge Function — Templates
**File:** `supabase/functions/send-email/index.ts`
- Add `"trial_day2"` to `EmailTemplate` type and `templatePreferenceMap`
- Update `trial_started` template: "7 days" → "3 days"
- Update `trial_day1` template: "6 days left" → "2 days left", compress the CTA
- Add new `trial_day2` template: personalized stats (materials, flashcards, XP), "Tomorrow is your last day" urgency, subscribe CTA
- Update `trial_day3` template: "expires today" messaging with 30% discount offer
- Update `trial_ending` template: "7-day" → "3-day" references
- Update `trial_expired` template: "7-day" → "3-day" references

### 5. UI Components — Copy updates
**Files:**
- `src/components/subscription/TrialBanner.tsx`: `totalTrialDays = 7` → `3`, urgency thresholds: `<= 1` high, `<= 2` medium
- `src/components/layout/sidebar/SidebarUpgradeCTA.tsx`: `'7 days free, then $9/month'` → `'3 days free, then $9/month'`
- `src/hooks/useSubscription.tsx`: Toast message `'7 days'` → `'3 days'`
- `src/pages/PricingPage.tsx`: Any "7-day" trial references → "3-day"
- `src/components/subscription/SubscriptionBlock.tsx`: Same copy updates

### 6. Onboarding Email Function
**File:** `supabase/functions/email-onboarding/index.ts`
- Remove `onboarding_day5` and `onboarding_day7` from the sequence (they fire after trial ends)
- Keep `onboarding_day2` only

## Email Drip Sequence (New)

```text
Day 0: trial_started — "Welcome! 3 days of Pro access"
Day 1: trial_day1   — "Here's what to try (2 days left)"
Day 2: trial_day2   — "Your stats so far + tomorrow is the last day"
Day 3: trial_day3   — "Trial ends today — 30% off if you subscribe now"
Post:  trial_expired — "Access paused — come back with 30% off"
```

## Files Modified
- New migration SQL (alter `handle_new_user_trial` trigger)
- `supabase/functions/paystack/index.ts`
- `supabase/functions/check-subscriptions/index.ts`
- `supabase/functions/send-email/index.ts`
- `supabase/functions/email-onboarding/index.ts`
- `src/components/subscription/TrialBanner.tsx`
- `src/components/layout/sidebar/SidebarUpgradeCTA.tsx`
- `src/hooks/useSubscription.tsx`
- `src/pages/PricingPage.tsx`
- `src/components/subscription/SubscriptionBlock.tsx`

