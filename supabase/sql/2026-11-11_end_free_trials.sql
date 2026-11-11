-- Pricing change (Nov 2026): no free trials. Free = one complete study set; Pro = unlimited.
--
-- Until now every new profile got a 3-day "pro"/"trial" subscription row from this trigger. That row
-- never granted anything on the server (get_user_plan only counts status = 'active'), but the web app
-- showed trial users Pro screens and trial banners. New signups now start on Free.
-- Existing trial rows are left in place for history; the apps treat them as Free.

drop trigger if exists on_profile_created_start_trial on public.profiles;
drop function if exists public.handle_new_user_trial();
