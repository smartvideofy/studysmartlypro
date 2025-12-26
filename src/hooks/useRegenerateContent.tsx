import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ContentType = "tutor_notes" | "summaries" | "flashcards" | "practice_questions" | "concept_map";

export function useRegenerateContent(materialId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contentType: ContentType) => {
      const { data, error } = await supabase.functions.invoke("regenerate-content", {
        body: { materialId, contentType },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, contentType) => {
      // Invalidate the relevant query based on content type
      const queryKeyMap: Record<ContentType, string> = {
        tutor_notes: "tutor-notes",
        summaries: "summaries",
        flashcards: "material-flashcards",
        practice_questions: "practice-questions",
        concept_map: "concept-map",
      };

      queryClient.invalidateQueries({ queryKey: [queryKeyMap[contentType], materialId] });
      toast.success(`${contentType.replace("_", " ")} regenerated successfully!`);
    },
    onError: (error) => {
      console.error("Regeneration error:", error);
      toast.error("Failed to regenerate content. Please try again.");
    },
  });
}
