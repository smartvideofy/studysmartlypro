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

// Tables that correspond to each pipeline step (for skip-on-retry checks)
const STEP_TABLE_MAP: Partial<Record<NotebookPipelineStep, string>> = {
  tutor_notes: 'notebook_tutor_notes',
  summaries: 'notebook_summaries',
  flashcards: 'notebook_flashcards',
  questions: 'notebook_practice_questions',
  concept_map: 'notebook_concept_maps',
};

/**
 * Check if a pipeline step already has data for this notebook (for retry resilience).
 */
async function stepHasData(notebookId: string, step: NotebookPipelineStep): Promise<boolean> {
  const table = STEP_TABLE_MAP[step];
  if (!table) return false; // 'complete' step has no table

  const { count, error } = await supabase
    .from(table as any)
    .select('id', { count: 'exact', head: true })
    .eq('notebook_id', notebookId);

  if (error) {
    console.warn(`Could not check existing data for step "${step}":`, error.message);
    return false;
  }
  return (count ?? 0) > 0;
}

/**
 * Run the notebook processing pipeline.
 * Refreshes session before each step and skips steps that already have data.
 */
export async function runNotebookPipeline(notebookId: string): Promise<void> {
  for (const step of NOTEBOOK_PIPELINE_STEPS) {
    // Skip steps that already have data (retry resilience)
    if (step !== 'complete') {
      const hasData = await stepHasData(notebookId, step);
      if (hasData) {
        console.log(`Notebook pipeline: skipping "${step}" (data already exists)`);
        continue;
      }
    }

    // Refresh session before each step to prevent JWT expiry
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Session expired. Please sign in again.');
    }

    console.log(`Notebook pipeline step: ${step}`);

    const { data, error } = await supabase.functions.invoke('process-notebook', {
      body: { notebookId, step },
      headers: { Authorization: `Bearer ${session.access_token}` },
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
