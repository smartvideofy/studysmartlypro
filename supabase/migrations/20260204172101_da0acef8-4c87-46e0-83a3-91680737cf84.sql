-- Add billing_interval column to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS billing_interval TEXT DEFAULT 'monthly';

-- Add comment for documentation
COMMENT ON COLUMN public.subscriptions.billing_interval IS 'Billing cycle: monthly or yearly';