
# Implement Annual Pricing with Monthly/Annual Toggle

## Overview

Add a billing cycle toggle to the pricing page allowing users to switch between monthly and annual pricing. Annual plans offer 2 months free (10x monthly instead of 12x), with visual savings indicators to encourage yearly commitments.

---

## Pricing Configuration

| Plan | Monthly | Yearly | Yearly PLN Code | Savings |
|------|---------|--------|-----------------|---------|
| Pro | $9/mo | $90/year | PLN_7mvshbtqgnmuygy | $18 (17% off) |
| Team | $19/mo | $190/year | PLN_lgfih0x6mwrycyf | $38 (17% off) |

---

## UI Design

```text
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│              Simple, transparent pricing                        │
│       Start free, upgrade when you need more. No hidden fees.   │
│                                                                 │
│           ┌─────────────────────────────────────┐               │
│           │   Monthly    [====○]    Annually    │               │
│           │                        Save up to 17%               │
│           └─────────────────────────────────────┘               │
│                                                                 │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐        │
│  │     Free     │   │     Pro      │   │     Team     │        │
│  │              │   │  ★ Popular   │   │              │        │
│  │     $0       │   │    $9/mo     │   │   $19/mo     │        │
│  │   /forever   │   │  or $90/yr   │   │  or $190/yr  │        │
│  │              │   │  SAVE $18    │   │  SAVE $38    │        │
│  │   [Start]    │   │  [Upgrade]   │   │  [Contact]   │        │
│  └──────────────┘   └──────────────┘   └──────────────┘        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Details

### 1. Update Edge Function Plans Configuration

**File:** `supabase/functions/paystack/index.ts`

Add billing interval support to the PLANS object:

```typescript
type BillingInterval = 'monthly' | 'yearly';

const PLANS = {
  pro: {
    monthly: {
      code: 'PLN_4e8hpv8om2lbhta',
      name: 'Studily Pro (Monthly)',
      amount: 9,
      interval: 'monthly',
      periodDays: 30,
    },
    yearly: {
      code: 'PLN_7mvshbtqgnmuygy',
      name: 'Studily Pro (Yearly)',
      amount: 90,
      interval: 'yearly',
      periodDays: 365,
    },
  },
  team: {
    monthly: {
      code: 'PLN_tmqbbw7lu7rzv5i',
      name: 'Studily Team (Monthly)',
      amount: 19,
      interval: 'monthly',
      periodDays: 30,
    },
    yearly: {
      code: 'PLN_lgfih0x6mwrycyf',
      name: 'Studily Team (Yearly)',
      amount: 190,
      interval: 'yearly',
      periodDays: 365,
    },
  },
};
```

### 2. Update Initialize Transaction Handler

Modify `initializeTransaction` to accept billing interval:

```typescript
async function initializeTransaction(
  user: { id: string; email: string },
  body: { plan: string; interval?: BillingInterval; callback_url?: string },
  supabase: any
) {
  const { plan, interval = 'monthly', callback_url } = body;
  
  const planConfig = PLANS[plan as keyof typeof PLANS];
  if (!planConfig) {
    return new Response(JSON.stringify({ error: 'Invalid plan' }), { ... });
  }
  
  const selectedPlan = planConfig[interval];
  // ... rest of initialization with selectedPlan
}
```

### 3. Update Verify Transaction Handler

Modify `verifyTransaction` to handle yearly periods:

```typescript
// Calculate period based on interval from metadata
const interval = txData.metadata?.interval || 'monthly';
const periodDays = interval === 'yearly' ? 365 : 30;

const periodEnd = new Date();
periodEnd.setDate(periodEnd.getDate() + periodDays);

// Store billing_interval in subscription record
await supabase.from('subscriptions').upsert({
  // ... existing fields
  billing_interval: interval,
  // ...
});
```

### 4. Update Subscription Type

**File:** `src/hooks/useSubscription.tsx`

Add billing interval to Subscription interface:

```typescript
export type BillingInterval = 'monthly' | 'yearly';

export interface Subscription {
  // ... existing fields
  billing_interval?: BillingInterval;
}
```

### 5. Update useInitializePayment Hook

Add interval parameter:

```typescript
export function useInitializePayment() {
  return useMutation({
    mutationFn: async ({
      plan,
      interval = 'monthly',
      callback_url,
    }: {
      plan: PlanType;
      interval?: BillingInterval;
      callback_url?: string;
    }) => {
      // ... existing auth check
      
      const { data, error } = await supabase.functions.invoke('paystack/initialize', {
        body: { plan, interval, callback_url },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      
      // ... rest unchanged
    },
  });
}
```

### 6. Update Pricing Page

**File:** `src/pages/PricingPage.tsx`

#### Add Billing Toggle Component

```typescript
import { Switch } from '@/components/ui/switch';

// State for billing interval
const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');

// Update plans configuration with both prices
const plans = [
  {
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    planType: 'free',
    // ...
  },
  {
    name: 'Pro',
    monthlyPrice: 9,
    yearlyPrice: 90,
    yearlySavings: 18,
    planType: 'pro',
    popular: true,
    // ...
  },
  {
    name: 'Team',
    monthlyPrice: 19,
    yearlyPrice: 190,
    yearlySavings: 38,
    planType: 'team',
    // ...
  },
];
```

#### Add Toggle UI

```typescript
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.1 }}
  className="flex items-center justify-center gap-4 mb-10"
>
  <span className={cn(
    "text-sm font-medium transition-colors",
    billingInterval === 'monthly' ? 'text-foreground' : 'text-muted-foreground'
  )}>
    Monthly
  </span>
  
  <Switch
    checked={billingInterval === 'yearly'}
    onCheckedChange={(checked) => setBillingInterval(checked ? 'yearly' : 'monthly')}
    className="data-[state=checked]:bg-primary"
  />
  
  <span className={cn(
    "text-sm font-medium transition-colors",
    billingInterval === 'yearly' ? 'text-foreground' : 'text-muted-foreground'
  )}>
    Annually
  </span>
  
  {billingInterval === 'yearly' && (
    <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
      Save up to 17%
    </Badge>
  )}
</motion.div>
```

#### Update Price Display

Dynamic pricing with smooth animations:

```typescript
<AnimatePresence mode="wait">
  <motion.div
    key={billingInterval}
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 10 }}
    className="mt-4"
  >
    <span className="text-4xl font-bold text-primary">
      ${billingInterval === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
    </span>
    <span className="text-muted-foreground">
      {plan.monthlyPrice === 0 
        ? '/forever' 
        : billingInterval === 'monthly' 
          ? '/month' 
          : '/year'}
    </span>
  </motion.div>
</AnimatePresence>

{/* Savings badge for yearly */}
{billingInterval === 'yearly' && plan.yearlySavings > 0 && (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    className="mt-2"
  >
    <Badge className="bg-green-500/10 text-green-600 border border-green-500/20">
      Save ${plan.yearlySavings}/year
    </Badge>
  </motion.div>
)}
```

#### Update handleSelectPlan

Pass interval to payment initialization:

```typescript
const handleSelectPlan = async (plan: PlanConfig) => {
  // ... existing validation
  
  const result = await initPayment.mutateAsync({
    plan: plan.planType,
    interval: billingInterval, // Pass selected interval
    callback_url: window.location.origin + '/pricing?verify=true',
  });
  
  // ... rest unchanged
};
```

### 7. Add Database Column (Optional Enhancement)

Add `billing_interval` column to track subscription type:

```sql
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS billing_interval TEXT DEFAULT 'monthly';
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/paystack/index.ts` | Update PLANS config, add interval handling |
| `src/hooks/useSubscription.tsx` | Add BillingInterval type, update mutation |
| `src/pages/PricingPage.tsx` | Add toggle, dynamic pricing, animations |

---

## User Experience Flow

1. User lands on pricing page (defaults to monthly)
2. Toggle between Monthly/Annually with smooth animations
3. See savings badge when annual is selected
4. Each plan card shows the current interval's price
5. "Save $X/year" badge appears on Pro/Team for yearly
6. Click upgrade sends correct plan code to Paystack
7. After payment, subscription shows correct renewal period

---

## Testing Considerations

- Verify monthly Pro upgrade flow works
- Verify annual Pro upgrade flow works
- Check price animations are smooth
- Confirm correct Paystack plan codes are sent
- Verify subscription period (30 days vs 365 days) is set correctly
- Test toggle state persistence during page interactions
