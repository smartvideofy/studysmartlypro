

# Edge Function API Audit

## Summary

Audited all 17 edge functions for correctness, security, and reliability. Found **3 critical bugs**, **2 medium issues**, and **2 low-priority issues**.

---

## Critical Issues

### 1. Welcome emails are BROKEN — `send_welcome_email_on_signup` trigger uses anon key
**Impact:** No new user receives a welcome email.

The database trigger `send_welcome_email_on_signup` calls `send-email` with the **anon key** in the `Authorization` header. But the recent security hardening of `send-email` requires either the **service role key** or a valid **user JWT**. The anon key is neither — so `send-email` returns 401 for every welcome email attempt.

**Fix:** Update the SQL trigger to use the service role key instead of the anon key. This requires a database migration to alter the `send_welcome_email_on_signup()` function.

### 2. `process-material` — IDOR (Insecure Direct Object Reference)
**Impact:** Any authenticated user can trigger processing on ANY other user's material.

The function authenticates the caller via `getClaims()` and stores their `userId`, but **never compares it** to `material.user_id`. It proceeds to process any `materialId` passed in the body, regardless of ownership.

**Fix:** Add `if (material.user_id !== userId) return 403` after fetching the material (around line 755).

### 3. `process-notebook` — IDOR (same pattern)
**Impact:** Any authenticated user can trigger notebook processing for any other user's notebook.

Same issue — authenticates the user but never checks `notebook.user_id === userId`.

**Fix:** Add ownership check after fetching the notebook (around line 416).

---

## Medium Issues

### 4. `check-subscriptions` — Inconsistent duplicate-email check columns
The `trial_day1` and `trial_day2` drip checks use `template_name` column:
```
.eq('template_name', 'trial_day1')
```
But the `trial_ending` (trial_day3) check uses `email_type` column:
```
.eq('email_type', 'trial_ending')
```
Since `send-email` logs both `email_type` and `template_name` with the same value, this works by coincidence. But the `trial_day3` template is being sent while checking for `trial_ending` — these are different values. This means the duplicate check will never match, and **trial_day3 emails could be sent repeatedly**.

**Fix:** Standardize all drip duplicate checks to use `template_name` and match the actual template being sent (`trial_day3`, not `trial_ending`).

### 5. `abandoned_checkout` email template shows ₦ (Naira) but plans are priced in USD
The template hardcodes Naira symbol `₦` and `₦3,500/month` fallback, but all plan pricing is configured in USD ($9/month, $90/year).

**Fix:** Update the abandoned checkout template to use `$` currency symbol and correct USD amounts.

---

## Low-Priority Issues

### 6. `generate-sitemap` — No authentication (intentional but worth noting)
This endpoint is open to anyone. It only reads public help articles/categories, so the risk is low — but it could be used for reconnaissance or to enumerate content.

**Action:** No change needed — public sitemap is standard practice. Note for awareness.

### 7. `process-video` — Missing `ELEVENLABS_API_KEY` secret reference
`generate-audio-overview` references `ELEVENLABS_API_KEY` which isn't in the project secrets list. It handles this gracefully (returns script without audio), but audio generation won't work.

**Action:** This is a known limitation — ElevenLabs integration is optional. No fix needed unless audio overview is desired.

---

## Functions That Passed Audit

| Function | Auth | Ownership | Input Validation | Error Handling |
|---|---|---|---|---|
| `ai-notes` | JWT via getClaims | N/A (user's own content) | Thorough (Zod-like) | Good |
| `material-chat` | JWT via getClaims | Checks `user_id` match | Good | Good |
| `regenerate-content` | JWT via getClaims | Checks `user_id` match | Good | Good |
| `paystack` | JWT + webhook signature | Checks user claims | Good | Good |
| `generate-audio-overview` | JWT via getClaims | Checks `user_id` match | Good | Good |
| `process-video` | JWT via getClaims | Inserts as own user | Good | Good |
| `send-push-notification` | JWT or service role | Self-only or service role | Good | Good |
| `send-email` | Service role or JWT | N/A (admin action) | Good | Good |
| `email-engagement` | Service role only | N/A (system) | Good | Good |
| `email-onboarding` | Service role only | N/A (system) | Good | Good |
| `schedule-study-reminder` | Service role only | N/A (system) | Good | Good |
| `schedule-session-reminder` | Service role only | N/A (system) | Good | Good |
| `check-subscriptions` | CRON_SECRET or service role | N/A (system) | Good | Good |
| `unsubscribe` | Token-based (intentional) | Token validates user | Good | Good |

---

## Fix Plan

### 1. Database migration — Fix welcome email trigger
Update `send_welcome_email_on_signup()` to use a reference to the service role key instead of the hardcoded anon key. Since `pg_net` in a trigger can't read Supabase vault secrets easily, the pragmatic fix is to use `SUPABASE_SERVICE_ROLE_KEY` from vault or pass it directly.

### 2. `process-material` — Add ownership check
After fetching the material, verify `material.user_id === userId`. Return 403 if mismatch.

### 3. `process-notebook` — Add ownership check
After fetching the notebook, verify `notebook.user_id === userId`. Return 403 if mismatch.

### 4. `check-subscriptions` — Fix duplicate check for trial_day3
Change `.eq('email_type', 'trial_ending')` to `.eq('template_name', 'trial_day3')`.

### 5. `send-email` — Fix currency in abandoned checkout template
Replace `₦` with `$` and update fallback pricing to `$9/month`.

---

## Files Modified
- New migration SQL — Fix `send_welcome_email_on_signup` trigger to use service role key
- `supabase/functions/process-material/index.ts` — Add ownership check
- `supabase/functions/process-notebook/index.ts` — Add ownership check
- `supabase/functions/check-subscriptions/index.ts` — Fix duplicate email check
- `supabase/functions/send-email/index.ts` — Fix currency in abandoned checkout template

