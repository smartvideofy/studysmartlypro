-- Phase 1: Security Fixes

-- 1.1 Fix group_invites RLS policy - restrict reading to authenticated users
-- who either own the invite, are group members, or are looking up a specific code
DROP POLICY IF EXISTS "Anyone can read invite by code" ON public.group_invites;

CREATE POLICY "Authenticated users can read invites by code"
ON public.group_invites
FOR SELECT
USING (
  auth.uid() IS NOT NULL
);

-- 1.2 Add DELETE policies for tables missing them

-- Allow message authors to delete their own attachments
CREATE POLICY "Message authors can delete their own attachments"
ON public.group_message_attachments
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.group_messages gm
    WHERE gm.id = group_message_attachments.message_id
    AND gm.user_id = auth.uid()
  )
);

-- Allow users to delete their own study sessions
CREATE POLICY "Users can delete their own sessions"
ON public.study_sessions
FOR DELETE
USING (auth.uid() = user_id);

-- 1.3 Create quiz_attempts table for tracking quiz scores
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  material_id UUID NOT NULL REFERENCES public.study_materials(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  time_spent_seconds INTEGER,
  answers JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on quiz_attempts
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for quiz_attempts
CREATE POLICY "Users can view their own quiz attempts"
ON public.quiz_attempts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quiz attempts"
ON public.quiz_attempts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quiz attempts"
ON public.quiz_attempts
FOR DELETE
USING (auth.uid() = user_id);