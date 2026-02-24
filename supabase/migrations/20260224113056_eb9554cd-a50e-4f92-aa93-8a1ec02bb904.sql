UPDATE study_materials 
SET processing_status = 'failed', 
    processing_error = 'Processing timed out. Please retry.',
    updated_at = now()
WHERE processing_status = 'processing' 
  AND updated_at < now() - interval '10 minutes';