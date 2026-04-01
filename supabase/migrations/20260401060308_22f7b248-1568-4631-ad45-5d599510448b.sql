
CREATE OR REPLACE FUNCTION public.handle_new_user_trial()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan, status, trial_start_date, trial_end_date, trial_used)
  VALUES (
    NEW.user_id,
    'pro',
    'trial',
    now(),
    now() + interval '3 days',
    true
  );
  RETURN NEW;
END;
$function$;
