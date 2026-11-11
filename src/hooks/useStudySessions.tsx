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

      // All study activity: study_activity_v unions the server-recorded study_activity (web and
      // mobile, via record-activity) with legacy study_sessions. Reading study_sessions alone showed
      // 0m / no activity for everyone, because nothing writes to it any more.
      const [{ data: rows, error }, { count: masteredCards }] = await Promise.all([
        supabase
          .from('study_activity_v')
          .select('occurred_at, duration_seconds, cards_or_items, correct_count, activity_type')
          .eq('user_id', user.id),
        supabase
          .from('flashcards')
          .select('id, flashcard_decks!inner(user_id)', { count: 'exact', head: true })
          .eq('flashcard_decks.user_id', user.id)
          .gte('interval_days', 21),
      ]);

      if (error) throw error;

      const sessions = (rows ?? []).map((r) => ({
        started_at: r.occurred_at as string,
        total_time_seconds: r.duration_seconds ?? 0,
        // Cards studied and accuracy only make sense for graded activities.
        graded: r.activity_type === 'flashcard_review' || r.activity_type === 'quiz',
        cards_studied: r.activity_type === 'flashcard_review' ? r.cards_or_items ?? 0 : 0,
        items: r.cards_or_items ?? 0,
        correct_count: r.correct_count ?? 0,
      }));

      // Calculate stats
      const totalSessions = sessions.length;
      const totalCardsStudied = sessions.reduce((sum, s) => sum + s.cards_studied, 0);
      const gradedItems = sessions.reduce((sum, s) => sum + (s.graded ? s.items : 0), 0);
      const totalCorrect = sessions.reduce((sum, s) => sum + (s.graded ? s.correct_count : 0), 0);
      const totalTimeMinutes = Math.round(sessions.reduce((sum, s) => sum + s.total_time_seconds, 0) / 60);

      // Calculate streak (consecutive days studied)
      const sessionDates = sessions
        .map(s => new Date(s.started_at).toDateString())
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
      const todaySessions = sessions.filter(
        s => new Date(s.started_at).toDateString() === today
      );
      const todayMinutes = Math.round(
        todaySessions.reduce((sum, s) => sum + (s.total_time_seconds || 0), 0) / 60
      );

      // Get this week's data for chart
      const weekData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toDateString();
        const daySessions = sessions.filter(
          s => new Date(s.started_at).toDateString() === dateStr
        );

        weekData.push({
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          minutes: Math.round(
            daySessions.reduce((sum, s) => sum + (s.total_time_seconds || 0), 0) / 60
          ),
          cards: daySessions.reduce((sum, s) => sum + (s.cards_studied || 0), 0),
          activities: daySessions.length,
        });
      }

      return {
        totalSessions,
        totalCardsStudied,
        totalCorrect,
        totalTimeMinutes,
        streak,
        todayMinutes,
        masteredCards: masteredCards ?? 0,
        accuracy: gradedItems > 0 ? Math.round((totalCorrect / gradedItems) * 100) : 0,
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
