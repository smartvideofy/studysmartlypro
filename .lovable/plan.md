
# Remove Free Tier and Implement Full Access Block After Trial

## Overview

Transform the subscription model from a freemium approach (Free/Pro/Team) to a trial-gated model where users get full Pro access for 7 days, then must subscribe to continue using the app. This creates a cleaner conversion funnel and stronger urgency.

---

## Current vs. New Model

```text
CURRENT MODEL:
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Signup    │ ──► │  7-Day Pro  │ ──► │  Free Tier  │ (limited features)
│             │     │   Trial     │     │  Limbo      │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼ (optional)
                                        ┌─────────────┐
                                        │  Subscribe  │
                                        └─────────────┘

NEW MODEL:
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Signup    │ ──► │  7-Day Pro  │ ──► │   BLOCKED   │
│             │     │   Trial     │     │ Subscribe   │
└─────────────┘     └─────────────┘     │ to Continue │
                                        └─────────────┘
```

---

## Changes Required

### 1. Remove Free Plan from Pricing Page

**File:** `src/pages/PricingPage.tsx`

- Remove the "Free" plan card entirely
- Simplify to just Pro ($9/mo) and Team ($19/mo)
- Update messaging to focus on trial-to-paid conversion
- Show "Your trial has ended" state for expired users

**New messaging:**
- Header: "Choose your plan" or "Continue learning with Studily"
- For trial users: "Your 7-day trial includes all Pro features"
- For expired users: "Subscribe to continue where you left off"

### 2. Create Full-Screen Block for Expired Users

**File:** `src/components/subscription/SubscriptionBlock.tsx` (New)

Create a blocking overlay/page that shows when:
- `subscription.status === 'expired'` AND
- `subscription.plan === 'free'` AND
- `subscription.trial_used === true`

Features:
- Friendly but clear messaging
- Show what they accomplished during trial (if we have data)
- Single CTA to pricing page
- No way to bypass

### 3. Update DashboardLayout to Block Expired Users

**File:** `src/components/layout/DashboardLayout.tsx`

Add a check that renders the SubscriptionBlock component instead of the main content when the user's trial has expired and they haven't subscribed.

### 4. Update Onboarding Messaging

**File:** `src/pages/OnboardingPage.tsx`

Improve the final step to clearly communicate:
- "You're starting your 7-day free trial"
- "Full Pro access - no credit card required"
- "After 7 days, choose a plan to continue"

Add a visual indicator or step that highlights the trial.

### 5. Update Subscription Hook

**File:** `src/hooks/useSubscription.tsx`

- Remove `PLAN_FEATURES.free` or make it identical to Pro (since no one should be on "free" anymore)
- Add a new helper: `useIsBlocked()` that returns `true` when access should be blocked
- Update `usePlanFeatures()` to handle blocked state

### 6. Update SidebarUpgradeCTA

**File:** `src/components/layout/sidebar/SidebarUpgradeCTA.tsx`

- Update condition: Show for trial users (with urgency) AND expired users
- Different messaging for each state
- Trial: "X days left - Subscribe now"
- Expired: "Subscribe to continue"

### 7. Update Settings Page Subscription Section

**File:** `src/pages/SettingsPage.tsx`

- Update messaging for expired state
- Remove "free plan" references
- Clear CTA for expired users

### 8. Update Email Templates

**File:** `supabase/functions/send-email/index.ts`

Update trial-related email templates:
- `trial_started`: "You now have full access for 7 days"
- `trial_ending`: "Don't lose access - subscribe now"
- `trial_expired`: "Your access has been paused" (not "downgraded")

### 9. Update PremiumGate Component

**File:** `src/components/subscription/PremiumGate.tsx`

Update the messaging from "Upgrade to Pro" to "Subscribe to Access" for expired trial users.

---

## Detailed Implementation

### SubscriptionBlock Component

```text
┌────────────────────────────────────────────────────────────┐
│                                                            │
│                      [Studily Logo]                        │
│                                                            │
│              Your trial has ended                          │
│                                                            │
│   Thanks for trying Studily! To continue accessing         │
│   your notes, flashcards, and AI study tools,              │
│   choose a plan below.                                     │
│                                                            │
│   ┌─────────────────────────────────────────────────┐     │
│   │  Your progress is safe:                          │     │
│   │  • 12 notes created                              │     │
│   │  • 45 flashcards studied                         │     │
│   │  • 3 hours of study time                         │     │
│   └─────────────────────────────────────────────────┘     │
│                                                            │
│              [Choose a Plan - Button]                      │
│                                                            │
│              Questions? Contact support                    │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Pricing Page Updates

**Remove Free tier card. New structure:**

```text
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                Choose your plan to continue                     │
│      All plans include everything you loved during your trial   │
│                                                                 │
│        [Monthly]  ─────○  [Annually] Save 17%                   │
│                                                                 │
│   ┌─────────────────────────┐  ┌─────────────────────────┐     │
│   │       PRO ⭐             │  │       TEAM              │     │
│   │       $9/month           │  │       $19/month         │     │
│   │                          │  │                         │     │
│   │  For individual          │  │  For study groups       │     │
│   │  students                │  │  (5 members)            │     │
│   │                          │  │                         │     │
│   │  ✓ Unlimited documents   │  │  ✓ Everything in Pro   │     │
│   │  ✓ AI summaries          │  │  ✓ Shared library      │     │
│   │  ✓ Practice questions    │  │  ✓ Team analytics      │     │
│   │  ✓ Concept maps          │  │  ✓ Admin dashboard     │     │
│   │  ✓ Export to Anki        │  │                         │     │
│   │                          │  │                         │     │
│   │  [Subscribe]             │  │  [Contact Sales]       │     │
│   └─────────────────────────┘  └─────────────────────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Onboarding Final Step Enhancement

Add a trial highlight card before the "Get Started" button:

```text
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   🎉 Your 7-day free trial starts now!                      │
│                                                             │
│   You'll get full access to:                                │
│   • Unlimited document uploads                              │
│   • AI-powered summaries & practice questions               │
│   • Concept maps & advanced study tools                     │
│   • Export to Anki                                          │
│                                                             │
│   No credit card required. Cancel anytime.                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/PricingPage.tsx` | Remove Free tier, update messaging |
| `src/components/subscription/SubscriptionBlock.tsx` | New full-screen block component |
| `src/components/layout/DashboardLayout.tsx` | Add blocking logic |
| `src/pages/OnboardingPage.tsx` | Add trial highlight messaging |
| `src/hooks/useSubscription.tsx` | Add `useIsBlocked` hook |
| `src/components/layout/sidebar/SidebarUpgradeCTA.tsx` | Update for expired state |
| `src/pages/SettingsPage.tsx` | Update subscription section messaging |
| `src/components/subscription/PremiumGate.tsx` | Update messaging for expired users |
| `supabase/functions/send-email/index.ts` | Update email template copy |

---

## Messaging Improvements Summary

| Location | Current | New |
|----------|---------|-----|
| Pricing header | "Simple, transparent pricing" | "Continue learning with Studily" |
| Free plan CTA | "Get Started Free" | (Removed) |
| Pro plan CTA (trial available) | "Start 7-Day Free Trial" | "Start Free Trial" |
| Pro plan CTA (trial expired) | "Start Pro Trial" | "Subscribe Now" |
| Trial banner | "Subscribe Now" | "Continue Access" |
| Onboarding finish | "Get Started" | "Start My Free Trial" |
| Block screen | (none) | "Your trial has ended - Choose a plan to continue" |
| Sidebar CTA | "Go Pro" | Trial: "X days left" / Expired: "Subscribe to continue" |

---

## Edge Cases to Handle

1. **Existing free users**: Users who signed up before this change and never used trial
   - Option A: Auto-start trial for them on next login
   - Option B: Block them with message "Start your free trial"

2. **Users mid-trial**: No change, they continue normally

3. **Expired trial users**: Show block screen, redirect to pricing

4. **Active subscribers**: No change, full access

5. **Cancelled subscribers**: Show block screen when subscription period ends

---

## Testing Checklist

- New user signup → Trial starts automatically → Full Pro access
- Trial user on day 7 → Clear blocking when trial expires
- Expired user clicks any nav → Redirected to block/pricing
- Expired user's data preserved after subscribing
- Settings page shows correct status for all states
- Pricing page shows 2 plans (no Free tier)
- Emails have updated messaging
