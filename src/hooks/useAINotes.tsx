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

async function ensureAuthenticated(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    toast.error("Please sign in to use AI features");
    return false;
  }
  return true;
}

function handleInvokeError(error: any, context: string): void {
  console.error(`${context} error:`, error);
  
  const message = error?.message || '';
  
  if (message.includes('401') || message.includes('Unauthorized') || message.includes('Authentication')) {
    toast.error("Please sign in again to use AI features");
  } else if (message.includes('429') || message.includes('Rate limit')) {
    toast.error("Too many requests. Please try again shortly.");
  } else if (message.includes('402') || message.includes('credits')) {
    toast.error("AI credits exhausted. Please try again later.");
  } else {
    toast.error(message || `Failed to ${context.toLowerCase()}`);
  }
}

export function useAISummarize() {
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  const summarize = async (noteTitle: string, noteContent: string) => {
    if (!noteContent.trim()) {
      toast.error("Note content is empty");
      return null;
    }

    // Check authentication first
    if (!(await ensureAuthenticated())) {
      return null;
    }

    setIsLoading(true);
    setSummary(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-notes', {
        body: { action: 'summarize', noteTitle, noteContent }
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setSummary(data.summary);
      toast.success("Summary generated!");
      return data.summary;
    } catch (error: any) {
      handleInvokeError(error, "Summarize");
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

    // Check authentication first
    if (!(await ensureAuthenticated())) {
      return null;
    }

    setIsLoading(true);
    setFlashcards(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-notes', {
        body: { action: 'generate-flashcards', noteTitle, noteContent }
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!Array.isArray(data?.flashcards)) {
        throw new Error("Invalid response from AI");
      }

      setFlashcards(data.flashcards);
      toast.success(`Generated ${data.flashcards.length} flashcards!`);
      return data.flashcards;
    } catch (error: any) {
      handleInvokeError(error, "Generate flashcards");
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

    // Check authentication first
    if (!(await ensureAuthenticated())) {
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
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!Array.isArray(data?.flashcards)) {
        throw new Error("Invalid response from AI");
      }

      setFlashcards(data.flashcards);
      toast.success(`Generated ${data.flashcards.length} flashcards!`);
      return data.flashcards;
    } catch (error: any) {
      handleInvokeError(error, "Generate flashcards");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { generateFlashcards, isLoading, flashcards, setFlashcards };
}
