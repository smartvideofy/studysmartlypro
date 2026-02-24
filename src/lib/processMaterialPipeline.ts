import { supabase } from "@/integrations/supabase/client";

export type PipelineStep = 'extract' | 'tutor_notes' | 'summaries' | 'flashcards' | 'questions' | 'concept_map' | 'complete';

const PIPELINE_STEPS: PipelineStep[] = [
  'extract',
  'tutor_notes',
  'summaries',
  'flashcards',
  'questions',
  'concept_map',
  'complete',
];

const STEP_LABELS: Record<PipelineStep, string> = {
  extract: 'Extracting content',
  tutor_notes: 'Generating tutor notes',
  summaries: 'Generating summaries',
  flashcards: 'Generating flashcards',
  questions: 'Generating practice questions',
  concept_map: 'Generating concept map',
  complete: 'Finalizing',
};

export { STEP_LABELS };

/**
 * Run the process-material edge function as a multi-step pipeline.
 * Each step is a separate invocation with its own memory budget.
 * If a step fails, the material is marked as failed and the error is thrown.
 */
export async function runProcessingPipeline(materialId: string): Promise<void> {
  for (const step of PIPELINE_STEPS) {
    console.log(`Pipeline step: ${step}`);

    const { data, error } = await supabase.functions.invoke('process-material', {
      body: { materialId, step },
    });

    if (error) {
      console.error(`Pipeline step "${step}" failed:`, error);

      // Try to extract the actual error message from the response
      let detailedError = error.message || '';
      try {
        // The edge function returns JSON with an "error" field
        if (error.context?.body) {
          const body = typeof error.context.body === 'string' ? JSON.parse(error.context.body) : error.context.body;
          if (body?.error) detailedError = body.error;
        }
      } catch {
        // best effort
      }

      // Check for specific status codes
      const status = error.context?.status;
      if (status === 402 || detailedError.includes('credits')) {
        // Don't mark as failed for credit issues — it's retryable
        throw new Error('AI credits exhausted. Please add more credits to your Lovable workspace and try again.');
      }
      if (status === 429 || detailedError.includes('Rate limit')) {
        throw new Error('AI service is busy. Please wait a moment and try again.');
      }

      // Mark as failed with which step broke
      try {
        await supabase
          .from('study_materials')
          .update({
            processing_status: 'failed' as string,
            processing_error: detailedError || `Failed during: ${STEP_LABELS[step]}`,
          })
          .eq('id', materialId);
      } catch {
        // best effort
      }

      throw new Error(detailedError || `Processing failed at step "${STEP_LABELS[step]}"`);
    }
  }
}
