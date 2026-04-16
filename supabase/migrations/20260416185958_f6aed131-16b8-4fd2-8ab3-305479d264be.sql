-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove existing schedule if present (idempotent)
DO $$
BEGIN
  PERFORM cron.unschedule('reconcile-payments-every-10min');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Schedule reconciliation to run every 10 minutes
SELECT cron.schedule(
  'reconcile-payments-every-10min',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://ngcmmvyebvekyutbixee.supabase.co/functions/v1/reconcile-payments',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nY21tdnllYnZla3l1dGJpeGVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NjUwMjUsImV4cCI6MjA4MjE0MTAyNX0.rMePJ1D84TtWk6o1a-e5pIZDV62GW3dkCh337ErpdQE'
    ),
    body := jsonb_build_object('triggered_at', now())
  );
  $$
);

-- One-off immediate run to recover any currently stuck payments
SELECT net.http_post(
  url := 'https://ngcmmvyebvekyutbixee.supabase.co/functions/v1/reconcile-payments',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nY21tdnllYnZla3l1dGJpeGVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NjUwMjUsImV4cCI6MjA4MjE0MTAyNX0.rMePJ1D84TtWk6o1a-e5pIZDV62GW3dkCh337ErpdQE'
  ),
  body := jsonb_build_object('triggered_at', now(), 'source', 'migration_oneoff')
);