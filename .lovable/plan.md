

# Edge Function Audit — Fix Plan

## Summary of Issues Found

### Critical Issues

**1. `send-email` has NO authentication**
The function accepts any request with zero auth checks. Anyone can trigger emails to any user_id, enabling spam and phishing.

**2. `send-push-notification` blocks server-to-server calls**
The function validates JWT via `getClaims()` and enforces "users can only send to themselves." However, `schedule-study-reminder` and `schedule-session-reminder` call it via service role with multiple `userIds` — these calls will **always fail** with 401 or 403.

**3. `email-engagement` has NO authentication**
Creates a service role client directly with no auth check. Any caller can trigger engagement emails for all users.

**4. `email-onboarding` has NO authentication**
Same issue — no auth guard. Any anonymous request triggers the onboarding drip for all matching users.

**5. `schedule-study-reminder` and `schedule-session-reminder` have NO authentication**
Open endpoints that anyone can invoke to trigger push notifications and in-app notifications to all users.

**6. `email_logs` table missing INSERT/DELETE RLS**
Authenticated users can insert or delete arbitrary email log records (scan finding).

**7. `user_achievements` allows self-insert without validation**
Users can claim any achievement by inserting rows directly (scan finding).

### Info-Level (Already Ignored/Acceptable)
- Realtime channel auth (requires Supabase Dashboard config — manual action)
- Leaked password protection (manual Dashboard action)
- Avatar bucket public (intentional)

---

## Fix Plan

### 1. Secure `send-email` — Add auth guard
Accept calls only from service role or authenticated users (for self-triggered templates like `achievement_earned`).

```
Check Authorization header:
- If it matches service_role key → allow (server-to-server)
- If valid user JWT via getClaims → allow only for self-targeted templates
- Otherwise → 401
```

### 2. Fix `send-push-notification` — Allow service role bypass
The self-only restriction is correct for user-initiated calls, but cron functions need to send to other users.

```
Check if caller is service_role:
- If Authorization header contains service_role key → skip the allTargetsSelf check
- If user JWT → keep existing self-only restriction
```

### 3. Secure `email-engagement` — Add service role / cron secret check
Same pattern as `check-subscriptions` (which already has this guard).

### 4. Secure `email-onboarding` — Add service role / cron secret check
Same guard as above.

### 5. Secure `schedule-study-reminder` and `schedule-session-reminder` — Add service role check
Verify the Authorization header contains service_role key before processing.

### 6. Database migration — Lock down `email_logs` and `user_achievements`
- `email_logs`: Deny INSERT/UPDATE/DELETE for all authenticated users (writes are service-role only via edge functions).
- `user_achievements`: Remove the client-side INSERT policy; achievements should only be granted server-side.

---

## Files Modified

- `supabase/functions/send-email/index.ts` — Add auth guard (service role or user JWT)
- `supabase/functions/send-push-notification/index.ts` — Allow service role to bypass self-only check
- `supabase/functions/email-engagement/index.ts` — Add service role / cron secret guard
- `supabase/functions/email-onboarding/index.ts` — Add service role / cron secret guard
- `supabase/functions/schedule-study-reminder/index.ts` — Add service role guard
- `supabase/functions/schedule-session-reminder/index.ts` — Add service role guard
- New migration SQL — RLS policies for `email_logs` and `user_achievements`

## Technical Details

The auth guard pattern for cron/system functions:

```typescript
const authHeader = req.headers.get('Authorization');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
if (!authHeader?.includes(serviceRoleKey)) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
}
```

For `send-push-notification`, add a service role check before the `allTargetsSelf` enforcement so that server-initiated notifications (study reminders, session reminders) work correctly while still preventing users from sending notifications to others.

