
-- =============================================
-- NOTEBOOKS: Combined Multi-Material Study
-- =============================================

-- 1. Create notebooks table
CREATE TABLE public.notebooks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  subject text,
  topic text,
  language text NOT NULL DEFAULT 'en',
  processing_status text DEFAULT 'pending',
  processing_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notebooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notebooks" ON public.notebooks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own notebooks" ON public.notebooks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notebooks" ON public.notebooks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notebooks" ON public.notebooks FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_notebooks_updated_at BEFORE UPDATE ON public.notebooks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Add notebook_id to study_materials
ALTER TABLE public.study_materials ADD COLUMN notebook_id uuid REFERENCES public.notebooks(id) ON DELETE SET NULL;
CREATE INDEX idx_study_materials_notebook_id ON public.study_materials(notebook_id);

-- 3. Notebook tutor notes
CREATE TABLE public.notebook_tutor_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notebook_id uuid NOT NULL REFERENCES public.notebooks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.notebook_tutor_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own notebook tutor notes" ON public.notebook_tutor_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own notebook tutor notes" ON public.notebook_tutor_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notebook tutor notes" ON public.notebook_tutor_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notebook tutor notes" ON public.notebook_tutor_notes FOR DELETE USING (auth.uid() = user_id);

-- 4. Notebook summaries
CREATE TABLE public.notebook_summaries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notebook_id uuid NOT NULL REFERENCES public.notebooks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  summary_type text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notebook_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own notebook summaries" ON public.notebook_summaries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own notebook summaries" ON public.notebook_summaries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notebook summaries" ON public.notebook_summaries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notebook summaries" ON public.notebook_summaries FOR DELETE USING (auth.uid() = user_id);

-- 5. Notebook flashcards
CREATE TABLE public.notebook_flashcards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notebook_id uuid NOT NULL REFERENCES public.notebooks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  front text NOT NULL,
  back text NOT NULL,
  hint text,
  difficulty text DEFAULT 'medium',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.notebook_flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own notebook flashcards" ON public.notebook_flashcards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own notebook flashcards" ON public.notebook_flashcards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notebook flashcards" ON public.notebook_flashcards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notebook flashcards" ON public.notebook_flashcards FOR DELETE USING (auth.uid() = user_id);

-- 6. Notebook practice questions
CREATE TABLE public.notebook_practice_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notebook_id uuid NOT NULL REFERENCES public.notebooks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  question_type text NOT NULL,
  question text NOT NULL,
  options jsonb,
  correct_answer text,
  explanation text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notebook_practice_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own notebook practice questions" ON public.notebook_practice_questions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own notebook practice questions" ON public.notebook_practice_questions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notebook practice questions" ON public.notebook_practice_questions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notebook practice questions" ON public.notebook_practice_questions FOR DELETE USING (auth.uid() = user_id);

-- 7. Notebook concept maps
CREATE TABLE public.notebook_concept_maps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notebook_id uuid NOT NULL REFERENCES public.notebooks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  nodes jsonb NOT NULL,
  edges jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.notebook_concept_maps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own notebook concept maps" ON public.notebook_concept_maps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own notebook concept maps" ON public.notebook_concept_maps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notebook concept maps" ON public.notebook_concept_maps FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notebook concept maps" ON public.notebook_concept_maps FOR DELETE USING (auth.uid() = user_id);
