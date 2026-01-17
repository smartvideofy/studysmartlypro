-- Create group_invites table for private group invitations
CREATE TABLE public.group_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  max_uses INTEGER DEFAULT NULL,
  use_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;

-- Only group admins/owners can create/view invites
CREATE POLICY "Group admins can manage invites"
ON public.group_invites
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = group_invites.group_id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- Anyone can read invite by code (for joining)
CREATE POLICY "Anyone can read invite by code"
ON public.group_invites
FOR SELECT
USING (true);

-- Create group_message_reads table to track last read message per user per group
CREATE TABLE public.group_message_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  last_read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Enable RLS
ALTER TABLE public.group_message_reads ENABLE ROW LEVEL SECURITY;

-- Users can manage their own read status
CREATE POLICY "Users can manage their own read status"
ON public.group_message_reads
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Function to get unread count for a user in a group
CREATE OR REPLACE FUNCTION public.get_group_unread_count(p_group_id UUID, p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  last_read TIMESTAMP WITH TIME ZONE;
  unread_count INTEGER;
BEGIN
  -- Get last read timestamp
  SELECT last_read_at INTO last_read
  FROM public.group_message_reads
  WHERE group_id = p_group_id AND user_id = p_user_id;

  -- If never read, count all messages
  IF last_read IS NULL THEN
    SELECT COUNT(*) INTO unread_count
    FROM public.group_messages
    WHERE group_id = p_group_id AND user_id != p_user_id;
  ELSE
    SELECT COUNT(*) INTO unread_count
    FROM public.group_messages
    WHERE group_id = p_group_id 
      AND user_id != p_user_id 
      AND created_at > last_read;
  END IF;

  RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;