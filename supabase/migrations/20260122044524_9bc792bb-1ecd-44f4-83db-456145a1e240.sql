-- Enable RLS on achievements table (it was missed)
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view achievements (they are public definitions)
CREATE POLICY "Everyone can view achievements"
ON public.achievements FOR SELECT
USING (true);