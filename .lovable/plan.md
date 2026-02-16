

# Abandoned Payment Tracking + Team Plan Checkout

## Overview

Two changes: (1) Track when users initiate checkout but don't complete payment, enabling follow-up email campaigns for abandoned checkouts; (2) Make the Team plan use Paystack checkout instead of "Contact Sales."

## 1. Abandoned Payment Tracking

### Database: New `payment_attempts` table

Create a table to record every checkout initiation:

```text
payment_attempts
- id (uuid, PK)
- user_id (uuid, NOT NULL)
- plan (text, NOT NULL) -- 'pro' or 'team'
- billing_interval (text, NOT NULL) -- 'monthly' or 'yearly'
- paystack_reference (text, NOT NULL)
- amount (integer) -- in cents
- status (text, default 'pending') -- 'pending', 'completed', 'abandoned'
- created_at (timestamptz, default now())
- completed_at (timestamptz, nullable)
```

RLS: Users can view their own attempts. Insert/update via service role in the edge function.

### Edge Function Changes (`supabase/functions/paystack/index.ts`)

- **`initializeTransaction`**: After getting the Paystack reference, insert a row into `payment_attempts` with status `pending`.
- **`verifyTransaction`**: After successful verification, update the matching `payment_attempts` row to status `completed` with a `completed_at` timestamp.

### Email Campaign Query

With this table, you can query abandoned checkouts for email campaigns:

```sql
SELECT pa.*, p.full_name, u.email
FROM payment_attempts pa
JOIN profiles p ON p.user_id = pa.user_id
WHERE pa.status = 'pending'
  AND pa.created_at < NOW() - INTERVAL '1 hour'
ORDER BY pa.created_at DESC;
```

This gives you everyone who started checkout but never completed it -- ready for follow-up emails.

## 2. Team Plan: Use Paystack Instead of "Contact Sales"

### Frontend Changes (`src/pages/PricingPage.tsx`)

- Remove the early return in `handleSelectPlan` that shows "Contact Sales" toast for team plans (lines 110-113).
- Update the button text rendering to show "Subscribe Now" instead of "Contact Sales" for team plans.

The backend already has Team plan codes configured in the `PLANS` object (monthly: `PLN_tmqbbw7lu7rzv5i`, yearly: `PLN_lgfih0x6mwrycyf`), so no edge function changes are needed for this part.

## Technical Summary

| File | Change |
|------|--------|
| New migration | Create `payment_attempts` table with RLS policies |
| `supabase/functions/paystack/index.ts` | Insert pending attempt on initialize, mark completed on verify |
| `src/pages/PricingPage.tsx` | Remove "Contact Sales" block, update Team button text |

