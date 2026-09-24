
DROP POLICY IF EXISTS "Authenticated users can upload group attachments" ON storage.objects;
CREATE POLICY "Group members can upload group attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'group-attachments'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

REVOKE INSERT, UPDATE, DELETE ON public.email_logs FROM anon, authenticated;
CREATE POLICY "No client writes on email_logs"
ON public.email_logs AS RESTRICTIVE FOR ALL TO anon, authenticated
USING (false) WITH CHECK (false);

REVOKE INSERT, UPDATE, DELETE ON public.payment_attempts FROM anon, authenticated;
CREATE POLICY "No client writes on payment_attempts"
ON public.payment_attempts AS RESTRICTIVE FOR ALL TO anon, authenticated
USING (true) WITH CHECK (false);

REVOKE INSERT, UPDATE, DELETE ON public.user_achievements FROM anon, authenticated;
CREATE POLICY "No client writes on user_achievements"
ON public.user_achievements AS RESTRICTIVE FOR ALL TO anon, authenticated
USING (true) WITH CHECK (false);

REVOKE EXECUTE ON FUNCTION public.get_group_unread_count(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_group_unread_counts(uuid[]) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_plan(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.notify_group_members(uuid, uuid, text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.search_group_messages(uuid, text, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.validate_and_join_invite(text) FROM PUBLIC, anon;

INSERT INTO public._applied_migrations(name) VALUES ('20260531185222_25ad0292-05c1-4b44-a9a8-8f1d7a024ef2.sql')
ON CONFLICT DO NOTHING;
