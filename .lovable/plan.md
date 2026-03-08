

# Improve Trial-to-Paid Conversion

## Overview
Enhance three key touchpoints: the SubscriptionBlock (shown when trial expires), the PricingPage (where users land to convert), and add a limited-time special offer for expired trial users.

## Changes

### 1. Enhanced SubscriptionBlock with Feature Comparison
**File:** `src/components/subscription/SubscriptionBlock.tsx`

Replace the simple bullet list with a visual "What you're missing" feature comparison grid showing Free (locked) vs Pro (unlocked). Add usage stats pulled from the user's actual data (e.g., "You have 12 materials waiting") to create urgency. Include a countdown-style special offer banner.

Key elements:
- Show personalized stats: number of materials, flashcards, notes the user created during trial
- Side-by-side mini comparison: Free (nothing) vs Pro (everything)
- Special offer badge: "Come back offer: 30% off your first month" with a code or auto-applied discount
- Two CTAs: "Subscribe Now" (primary) and "View Plans" (secondary)

### 2. Feature Comparison Table on Pricing Page
**File:** `src/pages/PricingPage.tsx`

Add a detailed feature comparison table below the plan cards. Show a grid with features as rows and Free/Pro/Team as columns, using check/cross icons. This helps users see the full value proposition at a glance.

Features to compare:
- Document uploads, AI summaries, flashcards, practice questions, concept maps, tutor notes, AI chat, audio overview, export to Anki, priority support, team features

### 3. Special Offer Banner for Expired Trial Users
**File:** `src/pages/PricingPage.tsx`

When `isExpiredUser` is true, show a prominent "Welcome Back" banner at the top of pricing with:
- "Get 30% off your first month" messaging
- A countdown timer (72 hours from first visit after expiry, stored in localStorage)
- Visual urgency with amber/gradient styling

### 4. Expired Trial Banner in Dashboard Layout
**File:** `src/components/subscription/ExpiredTrialBanner.tsx` (new)

Create a persistent banner that shows for expired trial users on every page (before SubscriptionBlock fully blocks). This catches users in the brief window and nudges them to pricing with the special offer mention.

## Technical Details

- **Personalized stats** in SubscriptionBlock: Query `study_materials`, `flashcard_decks`, `notebooks` counts via Supabase in the component
- **Countdown timer**: Store `expired_offer_start` timestamp in localStorage on first render of pricing page as expired user. Calculate remaining time from 72 hours.
- **No backend changes needed**: The 30% off messaging is a front-end nudge; actual discount would be applied via Paystack coupon code passed to the `initialize` endpoint (future backend enhancement). For now, display the offer and pass a `coupon` param that the edge function can handle later.
- **Feature comparison data**: Extract into a shared constant used by both PricingPage and SubscriptionBlock

## Files Modified
- `src/components/subscription/SubscriptionBlock.tsx` -- Enhanced with stats, comparison, special offer
- `src/pages/PricingPage.tsx` -- Add feature comparison table + expired user offer banner
- `src/components/subscription/ExpiredTrialBanner.tsx` -- New persistent banner component
- `src/components/layout/DashboardLayout.tsx` -- Import and render ExpiredTrialBanner

