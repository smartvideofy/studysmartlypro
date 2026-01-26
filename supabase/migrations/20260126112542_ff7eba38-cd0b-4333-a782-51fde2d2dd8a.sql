-- Fix branding in Help Center articles: replace "Studyly" with "Studily"
UPDATE help_articles 
SET content = REPLACE(content, 'Studyly', 'Studily'),
    title = REPLACE(title, 'Studyly', 'Studily'),
    summary = REPLACE(summary, 'Studyly', 'Studily'),
    updated_at = now()
WHERE content LIKE '%Studyly%' 
   OR title LIKE '%Studyly%' 
   OR summary LIKE '%Studyly%';