-- Read receipts table
CREATE TABLE public.message_read_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.group_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  read_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Enable RLS
ALTER TABLE public.message_read_receipts ENABLE ROW LEVEL SECURITY;

-- RLS policies for read receipts
CREATE POLICY "Users can view read receipts for messages in their groups"
ON public.message_read_receipts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_messages gm
    JOIN public.group_members gmbr ON gm.group_id = gmbr.group_id
    WHERE gm.id = message_read_receipts.message_id
    AND gmbr.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own read receipts"
ON public.message_read_receipts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add delivered_at column for delivery tracking
ALTER TABLE public.group_messages ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- Add link_preview column for URL previews
ALTER TABLE public.group_messages ADD COLUMN IF NOT EXISTS link_preview JSONB;

-- Add forwarded_from for message forwarding
ALTER TABLE public.group_messages ADD COLUMN IF NOT EXISTS forwarded_from UUID REFERENCES public.group_messages(id);

-- Starred messages table
CREATE TABLE public.starred_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.group_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  starred_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Enable RLS
ALTER TABLE public.starred_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for starred messages
CREATE POLICY "Users can view their own starred messages"
ON public.starred_messages
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can star messages"
ON public.starred_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unstar messages"
ON public.starred_messages
FOR DELETE
USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_message_read_receipts_message_id ON public.message_read_receipts(message_id);
CREATE INDEX idx_starred_messages_user_id ON public.starred_messages(user_id);