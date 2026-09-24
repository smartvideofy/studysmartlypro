
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS exam_date DATE,
  ADD COLUMN IF NOT EXISTS experience_level TEXT DEFAULT 'beginner',
  ADD COLUMN IF NOT EXISTS subjects TEXT[] DEFAULT '{}'::text[];
