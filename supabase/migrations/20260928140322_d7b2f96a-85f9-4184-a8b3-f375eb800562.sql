-- lovable-cron-fallback-reviewed: payment recovery needs a 10-minute window for dropped Paystack webhooks; session reminders must fire 15 minutes before a scheduled group session
SELECT cron.unschedule('email-onboarding-daily');
SELECT cron.unschedule('email-engagement-daily');
SELECT cron.unschedule('check-subscriptions-daily');
SELECT cron.unschedule('reconcile-payments-every-10min');

SELECT cron.schedule(
  'email-onboarding-daily',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://eymvatwanerhicklkwlm.supabase.co/functions/v1/email-onboarding',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer studily-internal-cron-2026-09-28-a7f4c1e9b2d6'
    ),
    body := jsonb_build_object('time', now())
  );
  $$
);

SELECT cron.schedule(
  'email-engagement-daily',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url := 'https://eymvatwanerhicklkwlm.supabase.co/functions/v1/email-engagement',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer studily-internal-cron-2026-09-28-a7f4c1e9b2d6'
    ),
    body := jsonb_build_object('time', now())
  );
  $$
);

SELECT cron.schedule(
  'check-subscriptions-daily',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://eymvatwanerhicklkwlm.supabase.co/functions/v1/check-subscriptions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer studily-internal-cron-2026-09-28-a7f4c1e9b2d6'
    ),
    body := jsonb_build_object('time', now())
  );
  $$
);

SELECT cron.schedule(
  'reconcile-payments-every-10min',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://eymvatwanerhicklkwlm.supabase.co/functions/v1/reconcile-payments',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer studily-internal-cron-2026-09-28-a7f4c1e9b2d6'
    ),
    body := jsonb_build_object('triggered_at', now())
  );
  $$
);

SELECT cron.schedule(
  'session-reminders-every-15min',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://eymvatwanerhicklkwlm.supabase.co/functions/v1/schedule-session-reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer studily-internal-cron-2026-09-28-a7f4c1e9b2d6'
    ),
    body := jsonb_build_object('triggered_at', now())
  );
  $$
);

-- Repoint the welcome email trigger at the new project and make it non-blocking
CREATE OR REPLACE FUNCTION public.send_welcome_email_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  BEGIN
    PERFORM net.http_post(
      url := 'https://eymvatwanerhicklkwlm.supabase.co/functions/v1/send-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer studily-internal-cron-2026-09-28-a7f4c1e9b2d6'
      ),
      body := jsonb_build_object(
        'user_id', NEW.user_id,
        'template', 'welcome'
      )
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'send_welcome_email_on_signup failed for %: %', NEW.user_id, SQLERRM;
  END;

  RETURN NEW;
END;
$function$;