CREATE OR REPLACE VIEW public.subscriptions_v
WITH (security_invoker = true) AS
SELECT
  user_id,
  plan,
  status,
  billing_interval AS interval,
  current_period_end,
  (status = 'trial') AS is_trial,
  GREATEST(0, CEIL(EXTRACT(EPOCH FROM (trial_end_date - now())) / 86400))::int AS trial_days_remaining,
  trial_end_date,
  cancelled_at
FROM public.subscriptions;

GRANT SELECT ON public.subscriptions_v TO authenticated;