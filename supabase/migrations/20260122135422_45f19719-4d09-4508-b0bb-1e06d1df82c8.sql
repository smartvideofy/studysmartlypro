-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.help_article_feedback;

-- Create a more restrictive policy - only authenticated users can submit feedback
CREATE POLICY "Authenticated users can submit feedback"
ON public.help_article_feedback
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);