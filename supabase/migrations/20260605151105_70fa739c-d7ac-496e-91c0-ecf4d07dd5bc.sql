
CREATE TABLE IF NOT EXISTS public.content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type text NOT NULL,
  content_id text,
  reported_user_id uuid,
  reason text NOT NULL,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.content_reports TO authenticated;
GRANT ALL ON public.content_reports TO service_role;
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users insert own reports" ON public.content_reports
  FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "users read own reports" ON public.content_reports
  FOR SELECT TO authenticated USING (reporter_id = auth.uid());
CREATE POLICY "admins read all reports" ON public.content_reports
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.user_blocks (
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id)
);
GRANT SELECT, INSERT, DELETE ON public.user_blocks TO authenticated;
GRANT ALL ON public.user_blocks TO service_role;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own blocks" ON public.user_blocks
  FOR ALL TO authenticated
  USING (blocker_id = auth.uid())
  WITH CHECK (blocker_id = auth.uid());
