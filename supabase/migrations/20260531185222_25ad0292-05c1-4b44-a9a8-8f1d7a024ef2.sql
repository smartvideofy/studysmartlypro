
-- 1. Tighten group-attachments INSERT to verify group membership via path
DROP POLICY IF EXISTS "Authenticated users can upload group attachments" ON storage.objects;
CREATE POLICY "Group members can upload group attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'group-attachments'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- 2. Restrict client writes on email_logs (service-role only)
REVOKE INSERT, UPDATE, DELETE ON public.email_logs FROM anon, authenticated;
CREATE POLICY "No client writes on email_logs"
ON public.email_logs AS RESTRICTIVE FOR ALL TO anon, authenticated
USING (false) WITH CHECK (false);

-- 3. Restrict client writes on payment_attempts (service-role only)
REVOKE INSERT, UPDATE, DELETE ON public.payment_attempts FROM anon, authenticated;
CREATE POLICY "No client writes on payment_attempts"
ON public.payment_attempts AS RESTRICTIVE FOR ALL TO anon, authenticated
USING (true) WITH CHECK (false);

-- 4. Restrict client writes on user_achievements (service-role only)
REVOKE INSERT, UPDATE, DELETE ON public.user_achievements FROM anon, authenticated;
CREATE POLICY "No client writes on user_achievements"
ON public.user_achievements AS RESTRICTIVE FOR ALL TO anon, authenticated
USING (true) WITH CHECK (false);

-- 5. Lock down SECURITY DEFINER function EXECUTE to authenticated only (revoke from anon/public)
REVOKE EXECUTE ON FUNCTION public.get_group_unread_count(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_group_unread_counts(uuid[]) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_plan(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.notify_group_members(uuid, uuid, text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.search_group_messages(uuid, text, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.validate_and_join_invite(text) FROM PUBLIC, anon;

-- 6. Realtime channel authorization — restrict subscriptions to owners / group members
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read own notification channel" ON realtime.messages;
CREATE POLICY "Authenticated can read own notification channel"
ON realtime.messages FOR SELECT TO authenticated
USING (
  realtime.topic() = 'notifications-realtime'
  OR realtime.topic() = 'notifications:' || auth.uid()::text
  OR (
    starts_with(realtime.topic(), 'group-chat-')
    AND public.is_group_member(
      NULLIF(replace(realtime.topic(), 'group-chat-', ''), '')::uuid,
      auth.uid()
    )
  )
  OR (
    starts_with(realtime.topic(), 'presence-')
    AND public.is_group_member(
      NULLIF(replace(realtime.topic(), 'presence-', ''), '')::uuid,
      auth.uid()
    )
  )
);
