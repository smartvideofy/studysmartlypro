-- Create group messages table for chat
CREATE TABLE public.group_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies - only group members can see/send messages
CREATE POLICY "Group members can view messages"
ON public.group_messages
FOR SELECT
USING (is_group_member(group_id, auth.uid()));

CREATE POLICY "Group members can send messages"
ON public.group_messages
FOR INSERT
WITH CHECK (is_group_member(group_id, auth.uid()) AND auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
ON public.group_messages
FOR DELETE
USING (auth.uid() = user_id);

-- Enable real-time for chat
ALTER TABLE public.group_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;

-- Create shared_notes table for notes shared to groups
CREATE TABLE public.shared_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL,
  shared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(note_id, group_id)
);

-- Enable RLS
ALTER TABLE public.shared_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Group members can view shared notes"
ON public.shared_notes
FOR SELECT
USING (is_group_member(group_id, auth.uid()));

CREATE POLICY "Note owners can share their notes"
ON public.shared_notes
FOR INSERT
WITH CHECK (
  is_group_member(group_id, auth.uid()) AND
  EXISTS (SELECT 1 FROM notes WHERE id = note_id AND user_id = auth.uid())
);

CREATE POLICY "Sharers can unshare notes"
ON public.shared_notes
FOR DELETE
USING (auth.uid() = shared_by);