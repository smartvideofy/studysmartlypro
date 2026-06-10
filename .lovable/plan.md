## Goal
Send a one-time Android app pre-launch announcement to every Studily web user who hasn't opted out, with the Play Store URL rendered as a hyperlinked CTA button (and an inline text link) — never as a raw URL.

## What I'll build

### 1. New edge function: `supabase/functions/broadcast-android-launch/index.ts`
- `verify_jwt = false` in code, but **admin-gated**: validates the caller's JWT via `getClaims()` and confirms `has_role(user_id, 'admin')`. Non-admins get 403.
- Accepts optional `{ dryRun: true }` to return the recipient count + a preview of the HTML without sending.
- Logic:
  1. Page through `profiles` (1000-row Supabase limit) to get all `user_id`s.
  2. For each user, look up `email_preferences` — skip if `marketing_emails = false` OR `product_updates = false` (whichever is the stricter opt-out flag we have; I'll inspect the table to pick the right column).
  3. Fetch the user's email from `auth.users` via the admin client (`SUPABASE_SERVICE_ROLE_KEY`).
  4. Render the HTML email (template inlined in the function — the existing `send-email` function uses a template registry, but this is a one-off so an inline template keeps it isolated).
  5. Send via Resend (already configured: `RESEND_API_KEY`, from `noreply@getstudily.com`).
  6. Insert a row into `email_logs` with `template_name = 'android_launch_announcement'` so we have an audit trail and the existing duplicate-protection in `email-engagement` ignores it.
  7. Batch in chunks of 50 with a small delay to stay under Resend's rate limit; return `{ sent, skipped, failed, total }`.

### 2. Email content
Exact copy you provided, formatted with:
- **Subject:** `The Studily Android app is almost here 🚀`
- Greeting using `profiles.full_name` when available, else "Hello".
- Body paragraphs as written.
- Feature checklist as a styled list.
- **Primary CTA:** Bold Pink button labeled **"View on Google Play"** linking to `https://play.google.com/store/apps/details?id=com.studily.app`.
- Inline hyperlinked text version of the same link in the "👉 Check out the Android app:" line (anchor text "Check out the Android app on Google Play") — never the raw URL.
- Footer with unsubscribe link pointing to the existing `unsubscribe` edge function, matching other transactional emails.
- Plain-text fallback included (with the URL written out for text clients).

### 3. How you trigger it
After deploy, I'll run it for you via `supabase--curl_edge_functions` using your logged-in admin session:
- First: `{ "dryRun": true }` → returns recipient count + renders the HTML so you can eyeball it.
- Then: `{}` → sends for real.

No UI is added.

## Technical notes
- Reuses existing `RESEND_API_KEY` and `noreply@getstudily.com` sender — no new secrets needed.
- Respects `email_preferences` opt-outs (I'll confirm the exact column name when reading the table; the existing `send-email` function already implements this check, so I'll mirror its logic).
- Logs to `email_logs` so engagement reports remain accurate and re-runs are safe (the function will refuse to re-send to a user who already received `android_launch_announcement`).
- Admin check uses the existing `has_role(auth.uid(), 'admin')` RPC — no new DB objects.

## Out of scope
- No push notifications, no in-app banner, no scheduling — just the one-time email.
- No changes to existing email templates or the `send-email` function.