
-- Create saved_responses table for pinning AI chat responses
CREATE TABLE public.saved_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID NOT NULL REFERENCES public.study_materials(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_responses ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own saved responses"
  ON public.saved_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved responses"
  ON public.saved_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved responses"
  ON public.saved_responses FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_saved_responses_material ON public.saved_responses(material_id, user_id);
