CREATE TABLE IF NOT EXISTS public.legacy_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  full_name text,
  legacy_user_id uuid,
  unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid(),
  unsubscribed boolean NOT NULL DEFAULT false,
  unsubscribed_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  campaign text NOT NULL DEFAULT 'relaunch_2026',
  resend_id text,
  sent_at timestamptz,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.legacy_recipients TO service_role;

ALTER TABLE public.legacy_recipients ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_legacy_recipients_token ON public.legacy_recipients(unsubscribe_token);
CREATE INDEX IF NOT EXISTS idx_legacy_recipients_status ON public.legacy_recipients(status);

CREATE OR REPLACE FUNCTION public.set_legacy_recipients_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_legacy_recipients_updated_at ON public.legacy_recipients;
CREATE TRIGGER trg_legacy_recipients_updated_at
BEFORE UPDATE ON public.legacy_recipients
FOR EACH ROW EXECUTE FUNCTION public.set_legacy_recipients_updated_at();