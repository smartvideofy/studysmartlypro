
-- 1. Fix subscription privilege escalation: Remove user INSERT and UPDATE policies
-- Subscriptions should only be managed by the trigger (trial) and edge functions (payments)
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscriptions;

-- 2. Fix group-attachments public bucket: Make it private
UPDATE storage.buckets SET public = false WHERE id = 'group-attachments';

-- Fix storage SELECT policy: require group membership instead of open access
DROP POLICY IF EXISTS "Anyone can view group attachments" ON storage.objects;

CREATE POLICY "Group members can view group attachments"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'group-attachments'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.group_message_attachments gma
    JOIN public.group_messages gm ON gm.id = gma.message_id
    JOIN public.group_members gmb ON gmb.group_id = gm.group_id
    WHERE gma.file_path = name
    AND gmb.user_id = auth.uid()
  )
);

-- 3. Fix group invites: Replace overly permissive policy with authenticated-only
DROP POLICY IF EXISTS "Anyone can read invite by code" ON public.group_invites;

-- The existing "Authenticated users can read invites by code" policy already handles this,
-- but let's verify it exists and covers the join flow
-- (from the scan results, this policy already exists with auth.uid() IS NOT NULL check)
