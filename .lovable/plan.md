

## Root Cause
Payments succeed on Paystack but users aren't upgraded because:
1. **Webhook isn't firing / isn't registered** — zero recent logs for the `paystack` function, and pending `payment_attempts` from April never resolved.
2. **Redirect verify is fragile** — if the user closes the tab or the redirect fails, no upgrade happens.
3. **No reconciliation fallback** to recover missed payments.

## Fix Plan

### 1. Harden the webhook handler (`supabase/functions/paystack/index.ts`)
- On `charge.success` / `subscription.create`, if `metadata.user_id` is missing, look up the user by `payment_attempts.paystack_reference` (using `data.reference`) as a fallback.
- Mark the matching `payment_attempts` row as `completed` inside the webhook (currently only `verify` does this).
- Add detailed logging of every event received for debugging.
- Handle additional events: `invoice.payment_failed`, `invoice.update`, `subscription.expiring_cards`.

### 2. Add a reconciliation cron job (new edge function `reconcile-payments`)
- Runs every 10 minutes via `pg_cron`.
- Selects `payment_attempts` where `status='pending'` and `created_at > now() - 24h`.
- Calls Paystack `GET /transaction/verify/{reference}` for each.
- If Paystack reports `success`, atomically claim the row (`update … where status='pending'`) and upsert the subscription using the same logic as `verifyTransaction`.
- This recovers any payment the webhook or redirect missed.

### 3. Manual recovery for the affected users
- For the 7 currently-pending references in `payment_attempts`, run the verify call once via the new reconciliation function (or a one-off script) so those paying users get upgraded immediately.

### 4. Webhook registration check (user action required)
- Confirm in the Paystack Dashboard → Settings → API Keys & Webhooks that the webhook URL is set to:
  `https://ngcmmvyebvekyutbixee.supabase.co/functions/v1/paystack/webhook`
- If it's missing or wrong, no webhook fix in code can help. I'll surface this clearly after the code changes ship.

### 5. Add observability
- Log every webhook event + signature-verify result.
- Log every reconciliation run with counts (checked / recovered / still pending).

## Files to change/create
- `supabase/functions/paystack/index.ts` — harden `handleWebhook`, add reference-based lookup, mark `payment_attempts` completed.
- `supabase/functions/reconcile-payments/index.ts` — new cron-triggered reconciler.
- `supabase/config.toml` — register new function with `verify_jwt = false`.
- New migration — `pg_cron` schedule (every 10 min) + one-off run to recover the 7 stuck references.

## Outcome
- No more silent payment losses: webhook + redirect + cron together guarantee delivery.
- Stuck users from the last weeks get auto-recovered on next cron tick.
- Full audit trail in logs + `payment_attempts` table.

