import type { QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { runProcessingPipeline } from "@/lib/processMaterialPipeline";

/**
 * Until Nov 2026, PDF/Word/PowerPoint text was never actually read: processing stored this
 * placeholder instead and generated study content from the file name. Such materials need a rebuild.
 */
export function isPlaceholderContent(content?: string | null): boolean {
  return /^Title: .*\nSubject: .*\nTopic: [^\n]*$/.test(content ?? "");
}

const GENERATED_TABLES = ["tutor_notes", "summaries", "material_flashcards", "practice_questions", "concept_maps"] as const;
const GENERATED_QUERY_KEYS = ["tutor-notes", "summaries", "material-flashcards", "practice-questions", "concept-map"];

/**
 * Throw away the generated content and run the processing pipeline again. The pipeline re-reads the
 * file (the server treats a stored placeholder as "not extracted"). The material shows its processing
 * screen while this runs; resolves when processing has finished.
 */
export async function rebuildMaterial(materialId: string, queryClient: QueryClient): Promise<void> {
  for (const table of GENERATED_TABLES) {
    const { error } = await supabase.from(table).delete().eq("material_id", materialId);
    if (error) throw new Error("Couldn't clear the old study content. Please try again.");
  }

  const { error } = await supabase
    .from("study_materials")
    .update({ processing_status: "pending", processing_error: null })
    .eq("id", materialId);
  if (error) throw new Error("Couldn't start the rebuild. Please try again.");

  queryClient.invalidateQueries({ queryKey: ["study-material", materialId] });
  try {
    await runProcessingPipeline(materialId);
  } finally {
    queryClient.invalidateQueries({ queryKey: ["study-material", materialId] });
    queryClient.invalidateQueries({ queryKey: ["study-materials"] });
    for (const key of GENERATED_QUERY_KEYS) queryClient.invalidateQueries({ queryKey: [key, materialId] });
  }
}
