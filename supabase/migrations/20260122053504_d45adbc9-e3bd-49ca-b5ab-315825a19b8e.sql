-- Phase 1: Message Pinning & Editing
ALTER TABLE public.group_messages 
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS pinned_by UUID,
  ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ;

-- Full-text search index for messages
CREATE INDEX IF NOT EXISTS idx_group_messages_content_fts 
  ON public.group_messages USING gin(to_tsvector('english', content));

-- Search function for group messages
CREATE OR REPLACE FUNCTION public.search_group_messages(
  p_group_id UUID,
  p_search_term TEXT,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  group_id UUID,
  user_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  reply_to_id UUID,
  is_pinned BOOLEAN,
  rank REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gm.id,
    gm.group_id,
    gm.user_id,
    gm.content,
    gm.created_at,
    gm.reply_to_id,
    gm.is_pinned,
    ts_rank(to_tsvector('english', gm.content), plainto_tsquery('english', p_search_term)) as rank
  FROM public.group_messages gm
  WHERE gm.group_id = p_group_id
    AND to_tsvector('english', gm.content) @@ plainto_tsquery('english', p_search_term)
  ORDER BY rank DESC, gm.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Phase 3: Scheduled Study Sessions
CREATE TABLE IF NOT EXISTS public.group_study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  meeting_link TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.group_study_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for study sessions
CREATE POLICY "Group members can view study sessions"
  ON public.group_study_sessions
  FOR SELECT
  USING (is_group_member(group_id, auth.uid()));

CREATE POLICY "Group members can create study sessions"
  ON public.group_study_sessions
  FOR INSERT
  WITH CHECK (is_group_member(group_id, auth.uid()) AND auth.uid() = created_by);

CREATE POLICY "Session creators can update their sessions"
  ON public.group_study_sessions
  FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Session creators can delete their sessions"
  ON public.group_study_sessions
  FOR DELETE
  USING (auth.uid() = created_by);

-- RSVP Table
CREATE TABLE IF NOT EXISTS public.study_session_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.group_study_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('going', 'maybe', 'not_going')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, user_id)
);

-- Enable RLS
ALTER TABLE public.study_session_rsvps ENABLE ROW LEVEL SECURITY;

-- RLS Policies for RSVPs
CREATE POLICY "Users can view RSVPs for sessions in their groups"
  ON public.study_session_rsvps
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_study_sessions gss
      JOIN public.group_members gm ON gm.group_id = gss.group_id
      WHERE gss.id = study_session_rsvps.session_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own RSVPs"
  ON public.study_session_rsvps
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Updated at trigger for study sessions
CREATE TRIGGER update_group_study_sessions_updated_at
  BEFORE UPDATE ON public.group_study_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();