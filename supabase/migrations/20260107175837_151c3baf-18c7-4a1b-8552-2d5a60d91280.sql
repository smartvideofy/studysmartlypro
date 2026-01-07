-- Fix INSERT policy to prevent users from creating notifications for other users
DROP POLICY IF EXISTS "Users can create their own notifications" ON public.notifications;

CREATE POLICY "Users can create their own notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);