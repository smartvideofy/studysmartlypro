-- Group Polls System
CREATE TABLE public.group_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ends_at TIMESTAMP WITH TIME ZONE,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  allow_multiple BOOLEAN NOT NULL DEFAULT false,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.group_polls(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.group_polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (poll_id, option_id, user_id)
);

-- Add reminder_sent to sessions for tracking
ALTER TABLE public.group_study_sessions 
ADD COLUMN IF NOT EXISTS reminder_sent_15min BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_sent_1hr BOOLEAN NOT NULL DEFAULT false;

-- Enable RLS
ALTER TABLE public.group_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- Polls policies (group members can view and create)
CREATE POLICY "Group members can view polls"
ON public.group_polls FOR SELECT
USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "Group members can create polls"
ON public.group_polls FOR INSERT
WITH CHECK (public.is_group_member(group_id, auth.uid()) AND auth.uid() = created_by);

CREATE POLICY "Poll creators and admins can update polls"
ON public.group_polls FOR UPDATE
USING (
  auth.uid() = created_by OR 
  EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = group_polls.group_id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Poll creators and admins can delete polls"
ON public.group_polls FOR DELETE
USING (
  auth.uid() = created_by OR 
  EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = group_polls.group_id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- Poll options policies
CREATE POLICY "Group members can view poll options"
ON public.poll_options FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_polls p
    WHERE p.id = poll_options.poll_id
    AND public.is_group_member(p.group_id, auth.uid())
  )
);

CREATE POLICY "Poll creators can insert options"
ON public.poll_options FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_polls p
    WHERE p.id = poll_options.poll_id
    AND p.created_by = auth.uid()
  )
);

-- Poll votes policies
CREATE POLICY "Group members can view votes"
ON public.poll_votes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_polls p
    WHERE p.id = poll_votes.poll_id
    AND public.is_group_member(p.group_id, auth.uid())
  )
);

CREATE POLICY "Group members can vote"
ON public.poll_votes FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.group_polls p
    WHERE p.id = poll_votes.poll_id
    AND public.is_group_member(p.group_id, auth.uid())
    AND (p.is_closed = false)
    AND (p.ends_at IS NULL OR p.ends_at > now())
  )
);

CREATE POLICY "Users can delete their own votes"
ON public.poll_votes FOR DELETE
USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_group_polls_group_id ON public.group_polls(group_id);
CREATE INDEX idx_poll_options_poll_id ON public.poll_options(poll_id);
CREATE INDEX idx_poll_votes_poll_id ON public.poll_votes(poll_id);
CREATE INDEX idx_poll_votes_user_id ON public.poll_votes(user_id);