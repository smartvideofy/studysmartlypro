
-- Recreate the welcome email trigger function to use service role key
CREATE OR REPLACE FUNCTION public.send_welcome_email_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  service_key text;
BEGIN
  -- Read the service role key from Supabase's built-in GUC
  service_key := coalesce(
    current_setting('supabase.service_role_key', true),
    current_setting('app.settings.service_role_key', true)
  );

  PERFORM net.http_post(
    url := 'https://ngcmmvyebvekyutbixee.supabase.co/functions/v1/send-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object(
      'user_id', NEW.user_id,
      'template', 'welcome'
    )
  );
  
  RETURN NEW;
END;
$function$;
