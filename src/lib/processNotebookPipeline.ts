import { supabase } from "@/integrations/supabase/client";

export type NotebookPipelineStep = 'tutor_notes' | 'summaries' | 'flashcards' | 'questions' | 'concept_map' | 'complete';

const NOTEBOOK_PIPELINE_STEPS: NotebookPipelineStep[] = [
  'tutor_notes',
  'summaries',
  'flashcards',
  'questions',
  'concept_map',
  'complete',
];

const STEP_LABELS: Record<NotebookPipelineStep, string> = {
  tutor_notes: 'Generating combined tutor notes',
  summaries: 'Generating combined summaries',
  flashcards: 'Generating combined flashcards',
  questions: 'Generating combined practice questions',
  concept_map: 'Generating combined concept map',
  complete: 'Finalizing',
};

export { STEP_LABELS as NOTEBOOK_STEP_LABELS };

/**
 * Run the notebook processing pipeline.
 * Waits for all materials to have extracted content, then generates combined content.
 */
export async function runNotebookPipeline(notebookId: string): Promise<void> {
  for (const step of NOTEBOOK_PIPELINE_STEPS) {
    console.log(`Notebook pipeline step: ${step}`);

    const { data, error } = await supabase.functions.invoke('process-notebook', {
      body: { notebookId, step },
    });

    if (error) {
      console.error(`Notebook pipeline step "${step}" failed:`, error);

      let detailedError = error.message || '';
      try {
        if (error.context?.body) {
          const body = typeof error.context.body === 'string' ? JSON.parse(error.context.body) : error.context.body;
          if (body?.error) detailedError = body.error;
        }
      } catch { /* best effort */ }

      const status = error.context?.status;
      if (status === 429 || detailedError.includes('Rate limit')) {
        throw new Error('AI service is busy. Please wait a moment and try again.');
      }
      if (status === 402 || detailedError.includes('quota') || detailedError.includes('Gemini')) {
        throw new Error('Gemini API quota exceeded. Please check your API key usage.');
      }

      // Mark notebook as failed
      try {
        await supabase
          .from('notebooks')
          .update({
            processing_status: 'failed' as string,
            processing_error: detailedError || `Failed during: ${STEP_LABELS[step]}`,
          })
          .eq('id', notebookId);
      } catch { /* best effort */ }

      throw new Error(detailedError || `Processing failed at step "${STEP_LABELS[step]}"`);
    }
  }
}
