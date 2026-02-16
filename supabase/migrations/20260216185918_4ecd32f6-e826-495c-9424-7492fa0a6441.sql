
-- Automatically start a 7-day free trial when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user_trial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan, status, trial_start_date, trial_end_date, trial_used)
  VALUES (
    NEW.user_id,
    'pro',
    'trial',
    now(),
    now() + interval '7 days',
    true
  );
  RETURN NEW;
END;
$$;

-- Fire after profile is created (which happens on signup via handle_new_user)
CREATE TRIGGER on_profile_created_start_trial
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_trial();
