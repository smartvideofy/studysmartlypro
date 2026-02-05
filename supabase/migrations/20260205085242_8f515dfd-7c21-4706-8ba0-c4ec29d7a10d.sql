-- Add trial columns to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_used BOOLEAN DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON COLUMN public.subscriptions.trial_start_date IS 'Timestamp when free trial started';
COMMENT ON COLUMN public.subscriptions.trial_end_date IS 'Timestamp when free trial expires (7 days from start)';
COMMENT ON COLUMN public.subscriptions.trial_used IS 'Whether user has already used their free trial';