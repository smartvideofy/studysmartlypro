

# Implement 7-Day Free Trial System

## Overview

Implement a backend-driven 7-day free trial system for new users. The trial grants full Pro-level access without requiring payment upfront. After 7 days, users must subscribe to continue using premium features.

---

## How It Works

```text
User Journey:

   Sign Up                    Trial Active                   Trial Ends
      │                           │                              │
      ▼                           ▼                              ▼
┌──────────────┐         ┌─────────────────┐           ┌─────────────────┐
│ Create       │    ──►  │ 7 Days Full     │    ──►    │ Must Subscribe  │
│ Account      │         │ Pro Access      │           │ or Downgrade    │
└──────────────┘         └─────────────────┘           └─────────────────┘
                                │                              │
                         Day 5: Soft reminder           Block premium
                         Day 7: Strong reminder         Show upgrade CTA
```

---

## Database Changes

### Add Trial Columns to `subscriptions` Table

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `trial_start_date` | TIMESTAMPTZ | NULL | When trial started |
| `trial_end_date` | TIMESTAMPTZ | NULL | When trial expires (7 days from start) |
| `trial_used` | BOOLEAN | FALSE | Prevents multiple trials per user |

### Migration SQL

```sql
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_used BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN public.subscriptions.trial_start_date IS 'Timestamp when free trial started';
COMMENT ON COLUMN public.subscriptions.trial_end_date IS 'Timestamp when free trial expires (7 days from start)';
COMMENT ON COLUMN public.subscriptions.trial_used IS 'Whether user has already used their free trial';
```

---

## Implementation Details

### 1. Start Trial on Signup

**File:** `supabase/functions/paystack/index.ts`

Add a new endpoint `start-trial` that:
- Checks if user has already used trial (`trial_used = true`)
- Creates a subscription record with:
  - `plan: 'pro'`
  - `status: 'trial'`
  - `trial_start_date: now()`
  - `trial_end_date: now() + 7 days`
  - `trial_used: true`

```typescript
async function startTrial(user: { id: string; email: string }, supabase: any) {
  // Check if user already has a subscription or used trial
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (existing?.trial_used) {
    return new Response(JSON.stringify({ 
      error: 'Trial already used',
      message: 'You have already used your free trial. Subscribe to access Pro features.'
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  if (existing?.plan !== 'free' && existing?.status === 'active') {
    return new Response(JSON.stringify({ 
      error: 'Already subscribed',
      message: 'You already have an active subscription.'
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const trialStart = new Date();
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 7);

  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: user.id,
      plan: 'pro',
      status: 'trial',
      trial_start_date: trialStart.toISOString(),
      trial_end_date: trialEnd.toISOString(),
      trial_used: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (error) throw error;

  // Send trial welcome email
  await sendTrialEmail(user.id, 'trial_started', {
    trialEndDate: trialEnd.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }),
  });

  return new Response(JSON.stringify({
    success: true,
    message: 'Trial started! Enjoy 7 days of Pro features.',
    trial_end_date: trialEnd.toISOString(),
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
```

### 2. Update Subscription Status Check

**File:** `supabase/functions/paystack/index.ts` - `getSubscription`

Modify to handle trial status:

```typescript
async function getSubscription(user: { id: string; email: string }, supabase: any) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!data) {
    return { subscription: { plan: 'free', status: 'active' } };
  }

  // Check if trial has expired
  if (data.status === 'trial' && data.trial_end_date) {
    const trialEnd = new Date(data.trial_end_date);
    if (trialEnd < new Date()) {
      // Trial expired - downgrade to free
      await supabase
        .from('subscriptions')
        .update({ 
          plan: 'free', 
          status: 'expired', 
          updated_at: new Date().toISOString() 
        })
        .eq('user_id', user.id);

      return { subscription: { ...data, plan: 'free', status: 'expired' } };
    }

    // Trial still active - calculate days remaining
    const daysRemaining = Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return { 
      subscription: { 
        ...data, 
        is_trial: true, 
        trial_days_remaining: daysRemaining 
      } 
    };
  }

  // ... rest of existing logic for active/cancelled subscriptions
}
```

### 3. Update Subscription Hook

**File:** `src/hooks/useSubscription.tsx`

Add trial-related fields:

```typescript
export interface Subscription {
  // ... existing fields
  trial_start_date?: string;
  trial_end_date?: string;
  trial_used?: boolean;
  is_trial?: boolean;
  trial_days_remaining?: number;
}

// New hook to start a trial
export function useStartTrial() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!session?.access_token) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('paystack/start-trial', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      toast.success(data.message || 'Trial started!');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

// Hook to get trial status
export function useTrialStatus() {
  const { data: subscription } = useSubscription();
  
  if (!subscription?.is_trial) {
    return { 
      isOnTrial: false, 
      trialDaysRemaining: 0, 
      trialExpired: subscription?.trial_used && subscription?.plan === 'free' 
    };
  }

  return {
    isOnTrial: true,
    trialDaysRemaining: subscription.trial_days_remaining || 0,
    trialEndDate: subscription.trial_end_date,
    trialExpired: false,
  };
}
```

### 4. Auto-Start Trial on First Login (Optional)

**File:** `src/pages/OnboardingPage.tsx`

Trigger trial start after onboarding:

```typescript
const startTrial = useStartTrial();

const handleCompleteOnboarding = async () => {
  // Save preferences
  await updateProfile.mutateAsync({ ... });
  
  // Auto-start 7-day trial for new users
  try {
    await startTrial.mutateAsync();
  } catch (e) {
    // Trial may already be used or user already subscribed - ignore
    console.log('Trial start skipped:', e.message);
  }
  
  navigate("/dashboard");
};
```

### 5. Trial Banner Component

**File:** `src/components/subscription/TrialBanner.tsx`

Display trial status prominently:

```typescript
export function TrialBanner() {
  const { isOnTrial, trialDaysRemaining } = useTrialStatus();
  const navigate = useNavigate();
  
  if (!isOnTrial) return null;

  const urgency = trialDaysRemaining <= 2 ? 'high' : trialDaysRemaining <= 4 ? 'medium' : 'low';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center justify-between px-4 py-2 text-sm",
        urgency === 'high' && "bg-destructive/10 text-destructive",
        urgency === 'medium' && "bg-amber-500/10 text-amber-600",
        urgency === 'low' && "bg-primary/10 text-primary"
      )}
    >
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4" />
        <span>
          {trialDaysRemaining === 1 
            ? "Your trial ends tomorrow!" 
            : `${trialDaysRemaining} days left in your Pro trial`}
        </span>
      </div>
      <Button size="sm" variant="default" onClick={() => navigate('/pricing')}>
        Subscribe Now
      </Button>
    </motion.div>
  );
}
```

### 6. Add Trial to Dashboard Layout

**File:** `src/components/layout/DashboardLayout.tsx`

Show trial banner at top:

```typescript
import { TrialBanner } from '@/components/subscription/TrialBanner';

// Inside the layout, above the main content:
<TrialBanner />
```

### 7. Update Check-Subscriptions for Trial Expiry

**File:** `supabase/functions/check-subscriptions/index.ts`

Add trial expiry handling:

```typescript
// Find trials expiring in 2 days (for reminder emails)
const twoDaysFromNow = new Date(now);
twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

const { data: expiringTrials } = await supabase
  .from('subscriptions')
  .select('id, user_id, trial_end_date')
  .eq('status', 'trial')
  .gte('trial_end_date', now.toISOString())
  .lte('trial_end_date', twoDaysFromNow.toISOString());

// Send trial ending reminders
for (const trial of expiringTrials || []) {
  await sendSubscriptionEmail(trial.user_id, 'trial_ending', {
    daysRemaining: 2,
    trialEndDate: new Date(trial.trial_end_date).toLocaleDateString()
  });
}

// Find and expire all ended trials
const { data: expiredTrials } = await supabase
  .from('subscriptions')
  .select('id, user_id')
  .eq('status', 'trial')
  .lt('trial_end_date', nowISO);

for (const trial of expiredTrials || []) {
  await supabase.from('subscriptions').update({
    plan: 'free',
    status: 'expired',
    updated_at: nowISO
  }).eq('id', trial.id);

  await sendSubscriptionEmail(trial.user_id, 'trial_expired', {});
}
```

### 8. Update Pricing Page

**File:** `src/pages/PricingPage.tsx`

Show trial CTA for new users:

```typescript
const { data: subscription } = useSubscription();
const startTrial = useStartTrial();

// In the Free plan card:
{!subscription?.trial_used ? (
  <Button 
    onClick={() => startTrial.mutate()}
    disabled={startTrial.isPending}
  >
    Start 7-Day Free Trial
  </Button>
) : (
  <Button disabled>Current Plan</Button>
)}
```

### 9. Update Settings Page

**File:** `src/pages/SettingsPage.tsx`

Show trial status:

```typescript
const { isOnTrial, trialDaysRemaining, trialExpired } = useTrialStatus();

// In subscription section:
{isOnTrial && (
  <Badge variant="outline" className="bg-primary/10 text-primary">
    Trial - {trialDaysRemaining} days left
  </Badge>
)}

{trialExpired && (
  <p className="text-sm text-muted-foreground">
    Your trial has ended. Subscribe to continue using Pro features.
  </p>
)}
```

---

## Trial Email Templates

Add these email templates to `send-email` function:

| Template | When Sent | Content |
|----------|-----------|---------|
| `trial_started` | Day 0 | Welcome! Here's what you can do with Pro |
| `trial_ending` | Day 5 | 2 days left - don't lose access! |
| `trial_expired` | Day 7+ | Trial ended - subscribe to continue |

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/migrations/...` | Add trial columns |
| `supabase/functions/paystack/index.ts` | Add `start-trial` endpoint, update `getSubscription` |
| `supabase/functions/check-subscriptions/index.ts` | Handle trial expiry |
| `supabase/functions/send-email/index.ts` | Add trial email templates |
| `src/hooks/useSubscription.tsx` | Add trial types and hooks |
| `src/components/subscription/TrialBanner.tsx` | New component |
| `src/components/layout/DashboardLayout.tsx` | Show trial banner |
| `src/pages/OnboardingPage.tsx` | Auto-start trial |
| `src/pages/PricingPage.tsx` | Trial CTA button |
| `src/pages/SettingsPage.tsx` | Trial status display |

---

## User Experience Summary

1. **New user signs up** → Completes onboarding → Trial auto-starts
2. **During trial** → Full Pro access + banner showing days remaining
3. **Day 5** → Email reminder "2 days left"
4. **Day 7** → Trial expires → Downgraded to Free
5. **After expiry** → Premium features locked → CTA to subscribe
6. **Subscribes** → Immediate full access via existing Paystack flow

---

## Testing Considerations

- Verify trial starts correctly for new users
- Confirm trial does not restart for existing users
- Test expiry logic when trial_end_date passes
- Verify premium features are locked after trial expires
- Test email reminders are sent at correct times
- Confirm subscription flow works correctly after trial

