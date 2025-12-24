import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface FlashcardDeck {
  id: string;
  user_id: string;
  note_id: string | null;
  name: string;
  description: string | null;
  subject: string | null;
  is_public: boolean;
  card_count: number;
  created_at: string;
  updated_at: string;
}

export interface Flashcard {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  hint: string | null;
  next_review: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  created_at: string;
  updated_at: string;
}

// SM-2 Algorithm implementation
export function calculateNextReview(
  quality: number, // 0-5 rating (0-2 = fail, 3-5 = pass)
  currentEaseFactor: number,
  currentInterval: number,
  currentRepetitions: number
) {
  let newEaseFactor = currentEaseFactor;
  let newInterval = currentInterval;
  let newRepetitions = currentRepetitions;

  if (quality < 3) {
    // Failed - reset
    newRepetitions = 0;
    newInterval = 1;
  } else {
    // Passed
    newRepetitions += 1;
    
    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(currentInterval * newEaseFactor);
    }
    
    // Update ease factor
    newEaseFactor = Math.max(
      1.3,
      currentEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + newInterval);

  return {
    ease_factor: newEaseFactor,
    interval_days: newInterval,
    repetitions: newRepetitions,
    next_review: nextReview.toISOString(),
  };
}

// Decks hooks
export function useDecks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['decks', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('flashcard_decks')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as FlashcardDeck[];
    },
    enabled: !!user?.id,
  });
}

export function useDeck(deckId: string) {
  return useQuery({
    queryKey: ['deck', deckId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flashcard_decks')
        .select('*')
        .eq('id', deckId)
        .single();

      if (error) throw error;
      return data as FlashcardDeck;
    },
    enabled: !!deckId,
  });
}

export function useCreateDeck() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deck: { name: string; description?: string; subject?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('flashcard_decks')
        .insert({
          user_id: user.id,
          name: deck.name,
          description: deck.description || null,
          subject: deck.subject || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks'] });
      toast.success('Deck created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create deck: ' + error.message);
    },
  });
}

export function useUpdateDeck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FlashcardDeck> & { id: string }) => {
      const { data, error } = await supabase
        .from('flashcard_decks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['decks'] });
      queryClient.invalidateQueries({ queryKey: ['deck', data.id] });
      toast.success('Deck updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update deck: ' + error.message);
    },
  });
}

export function useDeleteDeck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deckId: string) => {
      const { error } = await supabase
        .from('flashcard_decks')
        .delete()
        .eq('id', deckId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks'] });
      toast.success('Deck deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete deck: ' + error.message);
    },
  });
}

// Flashcards hooks
export function useFlashcards(deckId: string) {
  return useQuery({
    queryKey: ['flashcards', deckId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('deck_id', deckId)
        .order('created_at');

      if (error) throw error;
      return data as Flashcard[];
    },
    enabled: !!deckId,
  });
}

export function useDueFlashcards(deckId: string) {
  return useQuery({
    queryKey: ['due-flashcards', deckId],
    queryFn: async () => {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('deck_id', deckId)
        .lte('next_review', now)
        .order('next_review');

      if (error) throw error;
      return data as Flashcard[];
    },
    enabled: !!deckId,
  });
}

export function useCreateFlashcard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (card: { deck_id: string; front: string; back: string; hint?: string }) => {
      const { data, error } = await supabase
        .from('flashcards')
        .insert({
          deck_id: card.deck_id,
          front: card.front,
          back: card.back,
          hint: card.hint || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['flashcards', data.deck_id] });
      queryClient.invalidateQueries({ queryKey: ['decks'] });
      toast.success('Flashcard created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create flashcard: ' + error.message);
    },
  });
}

export function useUpdateFlashcard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, deck_id, ...updates }: Partial<Flashcard> & { id: string; deck_id: string }) => {
      const { data, error } = await supabase
        .from('flashcards')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, deck_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['flashcards', data.deck_id] });
      queryClient.invalidateQueries({ queryKey: ['due-flashcards', data.deck_id] });
    },
  });
}

export function useDeleteFlashcard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, deckId }: { id: string; deckId: string }) => {
      const { error } = await supabase
        .from('flashcards')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { deckId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['flashcards', data.deckId] });
      queryClient.invalidateQueries({ queryKey: ['decks'] });
      toast.success('Flashcard deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete flashcard: ' + error.message);
    },
  });
}

// Review flashcard (update spaced repetition)
export function useReviewFlashcard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      deckId, 
      quality,
      currentEaseFactor,
      currentInterval,
      currentRepetitions 
    }: { 
      id: string; 
      deckId: string;
      quality: number;
      currentEaseFactor: number;
      currentInterval: number;
      currentRepetitions: number;
    }) => {
      const updates = calculateNextReview(
        quality,
        currentEaseFactor,
        currentInterval,
        currentRepetitions
      );

      const { error } = await supabase
        .from('flashcards')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      return { deckId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['flashcards', data.deckId] });
      queryClient.invalidateQueries({ queryKey: ['due-flashcards', data.deckId] });
    },
  });
}
