-- Create function to send welcome email immediately on user signup
CREATE OR REPLACE FUNCTION public.send_welcome_email_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Use pg_net to call the send-email edge function
  -- This sends the welcome email immediately when a new user signs up
  PERFORM net.http_post(
    url := 'https://ngcmmvyebvekyutbixee.supabase.co/functions/v1/send-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nY21tdnllYnZla3l1dGJpeGVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NjUwMjUsImV4cCI6MjA4MjE0MTAyNX0.rMePJ1D84TtWk6o1a-e5pIZDV62GW3dkCh337ErpdQE'
    ),
    body := jsonb_build_object(
      'user_id', NEW.user_id,
      'template', 'welcome'
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to fire after profile is created (which happens on user signup)
DROP TRIGGER IF EXISTS trigger_send_welcome_email ON public.profiles;
CREATE TRIGGER trigger_send_welcome_email
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.send_welcome_email_on_signup();