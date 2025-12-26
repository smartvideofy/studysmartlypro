-- Create study_materials table (replaces notes concept for material-first workflow)
CREATE TABLE public.study_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT, -- pdf, docx, pptx, audio, image
  file_path TEXT, -- storage path
  file_size BIGINT,
  extracted_content TEXT, -- raw extracted text
  language TEXT DEFAULT 'en',
  subject TEXT,
  topic TEXT,
  processing_status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  processing_error TEXT,
  generate_tutor_notes BOOLEAN DEFAULT true,
  generate_flashcards BOOLEAN DEFAULT true,
  generate_questions BOOLEAN DEFAULT true,
  generate_concept_map BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;

-- RLS policies for study_materials
CREATE POLICY "Users can view their own materials" ON public.study_materials
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own materials" ON public.study_materials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own materials" ON public.study_materials
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own materials" ON public.study_materials
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_study_materials_updated_at
  BEFORE UPDATE ON public.study_materials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create tutor_notes table (AI-generated structured notes)
CREATE TABLE public.tutor_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES public.study_materials(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  content JSONB NOT NULL, -- structured: {topics, subtopics, definitions, examples, exam_tips}
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tutor_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tutor notes" ON public.tutor_notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tutor notes" ON public.tutor_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tutor notes" ON public.tutor_notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tutor notes" ON public.tutor_notes
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_tutor_notes_updated_at
  BEFORE UPDATE ON public.tutor_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create summaries table
CREATE TABLE public.summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES public.study_materials(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  summary_type TEXT NOT NULL, -- quick, detailed, bullet_points
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own summaries" ON public.summaries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own summaries" ON public.summaries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own summaries" ON public.summaries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own summaries" ON public.summaries
  FOR DELETE USING (auth.uid() = user_id);

-- Create practice_questions table
CREATE TABLE public.practice_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES public.study_materials(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  question_type TEXT NOT NULL, -- mcq, short_answer, case_based
  question TEXT NOT NULL,
  options JSONB, -- for MCQs: ["Option A", "Option B", "Option C", "Option D"]
  correct_answer TEXT,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.practice_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own practice questions" ON public.practice_questions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own practice questions" ON public.practice_questions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own practice questions" ON public.practice_questions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own practice questions" ON public.practice_questions
  FOR DELETE USING (auth.uid() = user_id);

-- Create concept_maps table
CREATE TABLE public.concept_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES public.study_materials(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  nodes JSONB NOT NULL, -- [{id, label, x, y, description}]
  edges JSONB NOT NULL, -- [{source, target, label}]
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.concept_maps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own concept maps" ON public.concept_maps
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own concept maps" ON public.concept_maps
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own concept maps" ON public.concept_maps
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own concept maps" ON public.concept_maps
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_concept_maps_updated_at
  BEFORE UPDATE ON public.concept_maps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for study materials
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('study-materials', 'study-materials', false, 52428800)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for study-materials bucket
CREATE POLICY "Users can view their own study materials files"
ON storage.objects FOR SELECT
USING (bucket_id = 'study-materials' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own study materials files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'study-materials' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own study materials files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'study-materials' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own study materials files"
ON storage.objects FOR DELETE
USING (bucket_id = 'study-materials' AND auth.uid()::text = (storage.foldername(name))[1]);