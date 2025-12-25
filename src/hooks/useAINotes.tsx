import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Flashcard {
  front: string;
  back: string;
}

interface GenerateOptions {
  cardCount?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
  cardType?: 'qa' | 'definition' | 'fill-blank' | 'mixed';
}

export function useAISummarize() {
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  const summarize = async (noteTitle: string, noteContent: string) => {
    if (!noteContent.trim()) {
      toast.error("Note content is empty");
      return null;
    }

    setIsLoading(true);
    setSummary(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-notes', {
        body: { action: 'summarize', noteTitle, noteContent }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setSummary(data.summary);
      toast.success("Summary generated!");
      return data.summary;
    } catch (error: any) {
      console.error("Summarize error:", error);
      toast.error(error.message || "Failed to generate summary");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { summarize, isLoading, summary, setSummary };
}

export function useAIGenerateFlashcards() {
  const [isLoading, setIsLoading] = useState(false);
  const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null);

  const generateFlashcards = async (noteTitle: string, noteContent: string) => {
    if (!noteContent.trim()) {
      toast.error("Note content is empty");
      return null;
    }

    setIsLoading(true);
    setFlashcards(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-notes', {
        body: { action: 'generate-flashcards', noteTitle, noteContent }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setFlashcards(data.flashcards);
      toast.success(`Generated ${data.flashcards.length} flashcards!`);
      return data.flashcards;
    } catch (error: any) {
      console.error("Generate flashcards error:", error);
      toast.error(error.message || "Failed to generate flashcards");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { generateFlashcards, isLoading, flashcards, setFlashcards };
}

export function useAIGenerateFlashcardsAdvanced() {
  const [isLoading, setIsLoading] = useState(false);
  const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null);

  const generateFlashcards = async (
    noteTitle: string, 
    noteContent: string,
    options?: GenerateOptions
  ) => {
    if (!noteContent.trim()) {
      toast.error("Content is empty");
      return null;
    }

    setIsLoading(true);
    setFlashcards(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-notes', {
        body: { 
          action: 'generate-flashcards', 
          noteTitle, 
          noteContent,
          cardCount: options?.cardCount || 10,
          difficulty: options?.difficulty || 'mixed',
          cardType: options?.cardType || 'qa',
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setFlashcards(data.flashcards);
      toast.success(`Generated ${data.flashcards.length} flashcards!`);
      return data.flashcards;
    } catch (error: any) {
      console.error("Generate flashcards error:", error);
      toast.error(error.message || "Failed to generate flashcards");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { generateFlashcards, isLoading, flashcards, setFlashcards };
}
