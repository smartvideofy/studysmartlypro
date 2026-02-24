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

      // Mark as failed with which step broke
      try {
        await supabase
          .from('study_materials')
          .update({
            processing_status: 'failed' as string,
            processing_error: `Failed during: ${STEP_LABELS[step]}. ${error.message || ''}`.trim(),
          })
          .eq('id', materialId);
      } catch {
        // best effort
      }

      throw new Error(`Processing failed at step "${STEP_LABELS[step]}"`);
    }
  }
}
