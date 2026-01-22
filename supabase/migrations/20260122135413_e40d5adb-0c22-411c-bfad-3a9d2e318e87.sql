-- Create help article feedback table
CREATE TABLE public.help_article_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.help_articles(id) ON DELETE CASCADE,
  user_id UUID,  -- Optional: can be null for anonymous feedback
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  -- Prevent duplicate feedback from same user on same article
  UNIQUE(article_id, user_id)
);

-- Create index for faster lookups
CREATE INDEX idx_help_feedback_article ON public.help_article_feedback(article_id);

-- Add helpful/not helpful counts to articles for quick access
ALTER TABLE public.help_articles 
ADD COLUMN helpful_count INTEGER DEFAULT 0,
ADD COLUMN not_helpful_count INTEGER DEFAULT 0;

-- Enable RLS
ALTER TABLE public.help_article_feedback ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read feedback counts (via articles table)
-- Allow authenticated users to submit feedback
CREATE POLICY "Anyone can submit feedback"
ON public.help_article_feedback
FOR INSERT
WITH CHECK (true);

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback"
ON public.help_article_feedback
FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

-- Users can update their own feedback
CREATE POLICY "Users can update own feedback"
ON public.help_article_feedback
FOR UPDATE
USING (auth.uid() = user_id);

-- Function to update article feedback counts
CREATE OR REPLACE FUNCTION public.update_article_feedback_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_helpful THEN
      UPDATE help_articles SET helpful_count = helpful_count + 1 WHERE id = NEW.article_id;
    ELSE
      UPDATE help_articles SET not_helpful_count = not_helpful_count + 1 WHERE id = NEW.article_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Adjust counts when feedback changes
    IF OLD.is_helpful AND NOT NEW.is_helpful THEN
      UPDATE help_articles SET helpful_count = helpful_count - 1, not_helpful_count = not_helpful_count + 1 WHERE id = NEW.article_id;
    ELSIF NOT OLD.is_helpful AND NEW.is_helpful THEN
      UPDATE help_articles SET helpful_count = helpful_count + 1, not_helpful_count = not_helpful_count - 1 WHERE id = NEW.article_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.is_helpful THEN
      UPDATE help_articles SET helpful_count = helpful_count - 1 WHERE id = OLD.article_id;
    ELSE
      UPDATE help_articles SET not_helpful_count = not_helpful_count - 1 WHERE id = OLD.article_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger to auto-update counts
CREATE TRIGGER update_feedback_counts
AFTER INSERT OR UPDATE OR DELETE ON public.help_article_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_article_feedback_counts();