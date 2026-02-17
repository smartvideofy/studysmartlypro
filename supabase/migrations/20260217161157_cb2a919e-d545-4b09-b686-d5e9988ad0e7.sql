-- Backfill extracted_content for materials that completed processing but have NULL extracted_content
UPDATE public.study_materials 
SET extracted_content = 'Title: ' || title || E'\nSubject: ' || COALESCE(subject, 'General') || E'\nTopic: ' || COALESCE(topic, title)
WHERE processing_status = 'completed' AND extracted_content IS NULL;