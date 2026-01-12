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

      if (error) {
        // Check for specific error messages from the edge function
        const errorMessage = error.message || "";
        if (errorMessage.includes("Rate limit") || error.context?.status === 429) {
          throw new Error("Rate limit exceeded. Please wait a moment and try again.");
        }
        if (errorMessage.includes("credits") || error.context?.status === 402) {
          throw new Error("AI credits exhausted. Please add credits to continue.");
        }
        throw error;
      }
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
      toast.success(`${contentType.replace(/_/g, " ")} regenerated successfully!`);
    },
    onError: (error) => {
      console.error("Regeneration error:", error);
      const message = error instanceof Error ? error.message : "Failed to regenerate content. Please try again.";
      toast.error(message);
    },
  });
}
