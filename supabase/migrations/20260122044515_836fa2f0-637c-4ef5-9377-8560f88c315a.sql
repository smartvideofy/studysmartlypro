-- Create audio_overviews table for storing podcast-style audio content
CREATE TABLE IF NOT EXISTS public.audio_overviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES public.study_materials(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  style TEXT NOT NULL DEFAULT 'deep_dive',
  script TEXT,
  audio_url TEXT,
  audio_path TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(material_id, style)
);

-- Enable RLS
ALTER TABLE public.audio_overviews ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own audio overviews"
ON public.audio_overviews FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own audio overviews"
ON public.audio_overviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own audio overviews"
ON public.audio_overviews FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own audio overviews"
ON public.audio_overviews FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_audio_overviews_updated_at
BEFORE UPDATE ON public.audio_overviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add gamification columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_study_date DATE;

-- Create achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL, -- study_time, cards, streaks, mastery
  tier TEXT NOT NULL DEFAULT 'bronze', -- bronze, silver, gold, platinum
  requirement_value INTEGER NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default achievements
INSERT INTO public.achievements (name, description, icon, category, tier, requirement_value, xp_reward) VALUES
-- Study Time achievements
('First Steps', 'Study for 1 hour total', 'clock', 'study_time', 'bronze', 60, 50),
('Dedicated Learner', 'Study for 10 hours total', 'clock', 'study_time', 'silver', 600, 150),
('Study Machine', 'Study for 100 hours total', 'clock', 'study_time', 'gold', 6000, 500),
-- Cards achievements
('Card Collector', 'Study 100 flashcards', 'layers', 'cards', 'bronze', 100, 50),
('Card Master', 'Study 1000 flashcards', 'layers', 'cards', 'silver', 1000, 200),
('Card Legend', 'Study 10000 flashcards', 'layers', 'cards', 'gold', 10000, 1000),
-- Streak achievements
('Getting Started', 'Maintain a 3-day streak', 'flame', 'streaks', 'bronze', 3, 30),
('Week Warrior', 'Maintain a 7-day streak', 'flame', 'streaks', 'bronze', 7, 75),
('Consistent Learner', 'Maintain a 30-day streak', 'flame', 'streaks', 'silver', 30, 300),
('Unstoppable', 'Maintain a 100-day streak', 'flame', 'streaks', 'gold', 100, 1000),
-- Mastery achievements
('First Mastery', 'Master 10 flashcards', 'award', 'mastery', 'bronze', 10, 50),
('Knowledge Builder', 'Master 100 flashcards', 'award', 'mastery', 'silver', 100, 250),
('Expert Level', 'Master 500 flashcards', 'award', 'mastery', 'gold', 500, 750)
ON CONFLICT DO NOTHING;

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_achievements
CREATE POLICY "Users can view their own achievements"
ON public.user_achievements FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can earn achievements"
ON public.user_achievements FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create daily_challenges table
CREATE TABLE IF NOT EXISTS public.daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  challenge_type TEXT NOT NULL, -- study_cards, study_time, accuracy
  target_value INTEGER NOT NULL,
  current_value INTEGER DEFAULT 0,
  xp_reward INTEGER NOT NULL DEFAULT 50,
  challenge_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, challenge_date)
);

-- Enable RLS
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own daily challenges"
ON public.daily_challenges FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily challenges"
ON public.daily_challenges FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can create daily challenges"
ON public.daily_challenges FOR INSERT
WITH CHECK (auth.uid() = user_id);