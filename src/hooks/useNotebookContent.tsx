import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Notebook-specific types (no material_id, have notebook_id instead)
export interface NotebookTutorNotes {
  id: string;
  notebook_id: string;
  user_id: string;
  content: {
    topics: Array<{
      title: string;
      subtopics: Array<{
        title: string;
        content: string;
        definitions?: Array<{ term: string; definition: string }>;
        examples?: string[];
        exam_tips?: string[];
      }>;
    }>;
  };
  created_at: string;
  updated_at: string;
}

export interface NotebookSummary {
  id: string;
  notebook_id: string;
  user_id: string;
  summary_type: 'quick' | 'detailed' | 'bullet_points';
  content: string;
  created_at: string;
}

export interface NotebookFlashcard {
  id: string;
  notebook_id: string;
  user_id: string;
  front: string;
  back: string;
  hint: string | null;
  difficulty: string;
  created_at: string;
  updated_at: string;
}

export interface NotebookPracticeQuestion {
  id: string;
  notebook_id: string;
  user_id: string;
  question_type: 'mcq' | 'short_answer' | 'case_based';
  question: string;
  options: string[] | null;
  correct_answer: string | null;
  explanation: string | null;
  created_at: string;
}

export interface NotebookConceptMap {
  id: string;
  notebook_id: string;
  user_id: string;
  nodes: Array<{ id: string; label: string; x: number; y: number; description?: string }>;
  edges: Array<{ source: string; target: string; label?: string }>;
  created_at: string;
  updated_at: string;
}

export function useNotebookTutorNotes(notebookId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['notebook-tutor-notes', notebookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notebook_tutor_notes')
        .select('*')
        .eq('notebook_id', notebookId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as NotebookTutorNotes[];
    },
    enabled: !!user && !!notebookId,
  });
}

export function useNotebookSummaries(notebookId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['notebook-summaries', notebookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notebook_summaries')
        .select('*')
        .eq('notebook_id', notebookId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as NotebookSummary[];
    },
    enabled: !!user && !!notebookId,
  });
}

export function useNotebookFlashcards(notebookId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['notebook-flashcards', notebookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notebook_flashcards')
        .select('*')
        .eq('notebook_id', notebookId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as unknown as NotebookFlashcard[];
    },
    enabled: !!user && !!notebookId,
  });
}

export function useNotebookPracticeQuestions(notebookId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['notebook-practice-questions', notebookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notebook_practice_questions')
        .select('*')
        .eq('notebook_id', notebookId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as NotebookPracticeQuestion[];
    },
    enabled: !!user && !!notebookId,
  });
}

export function useNotebookConceptMap(notebookId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['notebook-concept-map', notebookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notebook_concept_maps')
        .select('*')
        .eq('notebook_id', notebookId)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as NotebookConceptMap | null;
    },
    enabled: !!user && !!notebookId,
  });
}
