
# Reduce Trial to 3 Days + Optimized Email Drip

## Status: ✅ COMPLETED

## Changes Made

### 1. Database Migration
- Updated `handle_new_user_trial()` trigger: `interval '7 days'` → `interval '3 days'`

### 2. Paystack Edge Function
- Trial duration: 7 → 3 days
- Success message updated

### 3. Check-Subscriptions Edge Function
- Replaced 7-day drip with compressed 3-day sequence:
  - Day 1: "2 days left" email
  - Day 2: Stats + "last full day" urgency  
  - Day 3: "Expires today + 30% off"
- Trial ending reminder: 2 days → 1 day before expiry

### 4. Send-Email Templates
- Added `trial_day2` template type
- Updated all trial templates for 3-day messaging
- Added 30% discount offer to trial_day3 and trial_expired emails

### 5. UI Components
- TrialBanner: 7→3 total days, adjusted urgency thresholds
- SidebarUpgradeCTA: "3 days free"
- PricingPage: "3-day free trial" copy
- useSubscription: toast message updated

### 6. Email Onboarding
- Removed day 5 and day 7 emails (fire after trial ends)
- Kept day 2 only

## Email Drip Sequence

```
Day 0: trial_started — "Welcome! 3 days of Pro access"
Day 1: trial_day1   — "Here's what to try (2 days left)"
Day 2: trial_day2   — "Your stats + tomorrow is the last day"
Day 3: trial_day3   — "Trial ends today — 30% off"
Post:  trial_expired — "Access paused — 30% off inside"
```
