-- Add reply_to_id column for message threading
ALTER TABLE public.group_messages 
ADD COLUMN reply_to_id UUID REFERENCES public.group_messages(id) ON DELETE SET NULL;

-- Create group_message_attachments table for file sharing
CREATE TABLE public.group_message_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.group_messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on attachments
ALTER TABLE public.group_message_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies for attachments - group members can view/insert
CREATE POLICY "Group members can view attachments"
  ON public.group_message_attachments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_messages gm
      JOIN public.group_members gmbr ON gmbr.group_id = gm.group_id
      WHERE gm.id = group_message_attachments.message_id
      AND gmbr.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can insert attachments"
  ON public.group_message_attachments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_messages gm
      JOIN public.group_members gmbr ON gmbr.group_id = gm.group_id
      WHERE gm.id = group_message_attachments.message_id
      AND gmbr.user_id = auth.uid()
    )
  );

-- Create index for faster lookups
CREATE INDEX idx_group_messages_reply_to ON public.group_messages(reply_to_id);
CREATE INDEX idx_group_message_attachments_message ON public.group_message_attachments(message_id);

-- Create storage bucket for group chat attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('group-attachments', 'group-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for group attachments
CREATE POLICY "Anyone can view group attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'group-attachments');

CREATE POLICY "Authenticated users can upload group attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'group-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own group attachments"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'group-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);