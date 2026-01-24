-- Security Fix: Strengthen RLS policies for profiles, email_logs, and email_preferences tables
-- This addresses security findings: profiles_table_public_exposure, email_logs_recipient_exposure, email_preferences_token_exposure

-- 1. Fix profiles table: Add explicit auth check to "Group members can view each other's profiles"
DROP POLICY IF EXISTS "Group members can view each other's profiles" ON public.profiles;

CREATE POLICY "Group members can view each other's profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid() AND gm2.user_id = profiles.user_id
    )
  )
);

-- 2. Fix email_logs table: Add explicit null check for user_id
DROP POLICY IF EXISTS "Users can view their own email logs" ON public.email_logs;

CREATE POLICY "Users can view their own email logs"
ON public.email_logs
FOR SELECT
USING (auth.uid() IS NOT NULL AND user_id IS NOT NULL AND auth.uid() = user_id);

-- 3. Fix email_preferences table: Add explicit auth check for additional safety
DROP POLICY IF EXISTS "Users can view their own email preferences" ON public.email_preferences;

CREATE POLICY "Users can view their own email preferences"
ON public.email_preferences
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Also update the UPDATE policy for consistency
DROP POLICY IF EXISTS "Users can update their own email preferences" ON public.email_preferences;

CREATE POLICY "Users can update their own email preferences"
ON public.email_preferences
FOR UPDATE
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Also update the INSERT policy for consistency  
DROP POLICY IF EXISTS "Users can insert their own email preferences" ON public.email_preferences;

CREATE POLICY "Users can insert their own email preferences"
ON public.email_preferences
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);