-- Enable pg_cron extension for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- Schedule email-onboarding to run daily at 9:00 AM UTC
SELECT cron.schedule(
  'email-onboarding-daily',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ngcmmvyebvekyutbixee.supabase.co/functions/v1/email-onboarding',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nY21tdnllYnZla3l1dGJpeGVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NjUwMjUsImV4cCI6MjA4MjE0MTAyNX0.rMePJ1D84TtWk6o1a-e5pIZDV62GW3dkCh337ErpdQE'
    ),
    body := jsonb_build_object('time', now())
  );
  $$
);

-- Schedule email-engagement to run daily at 10:00 AM UTC
SELECT cron.schedule(
  'email-engagement-daily',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ngcmmvyebvekyutbixee.supabase.co/functions/v1/email-engagement',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nY21tdnllYnZla3l1dGJpeGVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NjUwMjUsImV4cCI6MjA4MjE0MTAyNX0.rMePJ1D84TtWk6o1a-e5pIZDV62GW3dkCh337ErpdQE'
    ),
    body := jsonb_build_object('time', now())
  );
  $$
);

-- Schedule check-subscriptions to run daily at 2:00 AM UTC
SELECT cron.schedule(
  'check-subscriptions-daily',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ngcmmvyebvekyutbixee.supabase.co/functions/v1/check-subscriptions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nY21tdnllYnZla3l1dGJpeGVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NjUwMjUsImV4cCI6MjA4MjE0MTAyNX0.rMePJ1D84TtWk6o1a-e5pIZDV62GW3dkCh337ErpdQE'
    ),
    body := jsonb_build_object('time', now())
  );
  $$
);