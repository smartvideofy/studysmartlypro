
CREATE TABLE public.payment_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  plan text NOT NULL,
  billing_interval text NOT NULL,
  paystack_reference text NOT NULL,
  amount integer,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payment attempts"
  ON public.payment_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_payment_attempts_user_id ON public.payment_attempts(user_id);
CREATE INDEX idx_payment_attempts_status ON public.payment_attempts(status);
CREATE INDEX idx_payment_attempts_reference ON public.payment_attempts(paystack_reference);
