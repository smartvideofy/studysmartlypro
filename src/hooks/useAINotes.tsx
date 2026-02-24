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

async function getAccessToken(): Promise<string | null> {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error("Session error:", error);
    return null;
  }
  
  if (!session?.access_token) {
    return null;
  }
  
  // Validate the token is still valid
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error("Token validation failed:", userError);
    // Token is invalid, sign out
    await supabase.auth.signOut();
    return null;
  }
  
  return session.access_token;
}

async function handleInvokeError(error: any, context: string): Promise<void> {
  console.error(`${context} error:`, error);
  
  // Try to extract error message from response body
  let errorMessage = '';
  
  if (error?.context?.json) {
    try {
      const jsonError = await error.context.json();
      errorMessage = jsonError?.error || '';
    } catch {
      // Ignore parsing errors
    }
  }
  
  if (!errorMessage) {
    errorMessage = error?.message || '';
  }
  
  // Check status code
  const status = error?.context?.status;
  
  if (status === 401 || errorMessage.includes('Authentication') || errorMessage.includes('Unauthorized')) {
    toast.error("Please sign in again to use AI features");
    await supabase.auth.signOut();
  } else if (status === 429 || errorMessage.includes('Rate limit')) {
    toast.error("Too many requests. Please try again shortly.");
  } else if (status === 402 || errorMessage.includes('quota') || errorMessage.includes('Gemini')) {
    toast.error("Gemini API quota exceeded. Please check your API key usage.");
  } else if (errorMessage) {
    toast.error(errorMessage);
  } else {
    toast.error(`Failed to ${context.toLowerCase()}. Please try again.`);
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

    // Get access token
    const accessToken = await getAccessToken();
    if (!accessToken) {
      toast.error("Please sign in to use AI features");
      return null;
    }

    setIsLoading(true);
    setSummary(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-notes', {
        body: { action: 'summarize', noteTitle, noteContent },
        headers: { Authorization: `Bearer ${accessToken}` }
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
      await handleInvokeError(error, "Summarize");
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

    // Get access token
    const accessToken = await getAccessToken();
    if (!accessToken) {
      toast.error("Please sign in to use AI features");
      return null;
    }

    setIsLoading(true);
    setFlashcards(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-notes', {
        body: { action: 'generate-flashcards', noteTitle, noteContent },
        headers: { Authorization: `Bearer ${accessToken}` }
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
      await handleInvokeError(error, "Generate flashcards");
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

    // Get access token
    const accessToken = await getAccessToken();
    if (!accessToken) {
      toast.error("Please sign in to use AI features");
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
        },
        headers: { Authorization: `Bearer ${accessToken}` }
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
      await handleInvokeError(error, "Generate flashcards");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { generateFlashcards, isLoading, flashcards, setFlashcards };
}
