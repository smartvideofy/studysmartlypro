

# Hide "Go Premium" CTA for Paid Subscribers

## Problem
The mobile menu drawer (`MobileMenuDrawer.tsx`) always shows the "Go Premium" upgrade card regardless of subscription status. Paid users and active trial users should not see this.

## Solution
Add a subscription check to the mobile drawer's Premium CTA section, matching the logic already used in `SidebarUpgradeCTA.tsx`.

## Technical Details

### File: `src/components/layout/MobileMenuDrawer.tsx`

1. Import `useSubscription` and `useTrialStatus` hooks
2. Wrap the "Premium CTA" block (lines 186-202) in a conditional that hides it when:
   - The user has an active paid subscription (`status === 'active'` and `plan !== 'free'` and not on trial)
   - This matches the existing logic in `SidebarUpgradeCTA.tsx` line 20

The conditional logic:
```text
const { data: subscription } = useSubscription();
const isPaidUser = subscription?.status === 'active' 
  && subscription?.plan !== 'free' 
  && !subscription?.is_trial;

// Only render Premium CTA if NOT a paid user
```

No other files need changes.
