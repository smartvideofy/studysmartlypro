import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface StudySession {
  id: string;
  user_id: string;
  deck_id: string | null;
  started_at: string;
  ended_at: string | null;
  cards_studied: number;
  correct_count: number;
  total_time_seconds: number;
  created_at: string;
}

export function useStudySessions(limit?: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['study-sessions', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('study_sessions')
        .select('*, flashcard_decks(name)')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

export function useStudyStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['study-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Get all sessions for the user
      const { data: sessions, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      // Calculate stats
      const totalSessions = sessions?.length || 0;
      const totalCardsStudied = sessions?.reduce((sum, s) => sum + (s.cards_studied || 0), 0) || 0;
      const totalCorrect = sessions?.reduce((sum, s) => sum + (s.correct_count || 0), 0) || 0;
      const totalTimeMinutes = Math.round(
        (sessions?.reduce((sum, s) => sum + (s.total_time_seconds || 0), 0) || 0) / 60
      );

      // Calculate streak (consecutive days studied)
      const sessionDates = sessions
        ?.map(s => new Date(s.started_at).toDateString())
        .filter((date, i, arr) => arr.indexOf(date) === i)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

      let streak = 0;
      if (sessionDates && sessionDates.length > 0) {
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        
        if (sessionDates[0] === today || sessionDates[0] === yesterday) {
          streak = 1;
          for (let i = 1; i < sessionDates.length; i++) {
            const current = new Date(sessionDates[i - 1]);
            const prev = new Date(sessionDates[i]);
            const diffDays = Math.round((current.getTime() - prev.getTime()) / 86400000);
            
            if (diffDays === 1) {
              streak++;
            } else {
              break;
            }
          }
        }
      }

      // Get today's study time
      const today = new Date().toDateString();
      const todaySessions = sessions?.filter(
        s => new Date(s.started_at).toDateString() === today
      ) || [];
      const todayMinutes = Math.round(
        todaySessions.reduce((sum, s) => sum + (s.total_time_seconds || 0), 0) / 60
      );

      // Get this week's data for chart
      const weekData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toDateString();
        const daySessions = sessions?.filter(
          s => new Date(s.started_at).toDateString() === dateStr
        ) || [];
        
        weekData.push({
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          minutes: Math.round(
            daySessions.reduce((sum, s) => sum + (s.total_time_seconds || 0), 0) / 60
          ),
          cards: daySessions.reduce((sum, s) => sum + (s.cards_studied || 0), 0),
        });
      }

      return {
        totalSessions,
        totalCardsStudied,
        totalCorrect,
        totalTimeMinutes,
        streak,
        todayMinutes,
        accuracy: totalCardsStudied > 0 ? Math.round((totalCorrect / totalCardsStudied) * 100) : 0,
        weekData,
      };
    },
    enabled: !!user?.id,
  });
}

export function useCreateStudySession() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (session: { deck_id?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('study_sessions')
        .insert({
          user_id: user.id,
          deck_id: session.deck_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-sessions'] });
    },
  });
}

export function useUpdateStudySession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      ...updates 
    }: { 
      id: string;
      ended_at?: string;
      cards_studied?: number;
      correct_count?: number;
      total_time_seconds?: number;
    }) => {
      const { data, error } = await supabase
        .from('study_sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['study-stats'] });
    },
  });
}

export function useEndStudySession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      cardsStudied, 
      correctCount, 
      totalTimeSeconds 
    }: { 
      id: string;
      cardsStudied: number;
      correctCount: number;
      totalTimeSeconds: number;
    }) => {
      const { data, error } = await supabase
        .from('study_sessions')
        .update({
          ended_at: new Date().toISOString(),
          cards_studied: cardsStudied,
          correct_count: correctCount,
          total_time_seconds: totalTimeSeconds,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['study-stats'] });
      toast.success('Study session completed!');
    },
  });
}
