-- Add INSERT policy for notifications table
-- This allows users/Edge Functions to create notifications for users
CREATE POLICY "Users can create their own notifications"
ON public.notifications FOR INSERT
WITH CHECK (auth.uid() = user_id);