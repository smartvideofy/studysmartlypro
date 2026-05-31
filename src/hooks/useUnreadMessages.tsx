import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface GroupUnreadCount {
  groupId: string;
  count: number;
}

export function useUnreadCounts(groupIds: string[]) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['unread-counts', user?.id, [...groupIds].sort().join(',')],
    queryFn: async () => {
      if (!user?.id || groupIds.length === 0) return {};

      const { data, error } = await supabase.rpc('get_group_unread_counts', {
        p_group_ids: groupIds,
      });

      if (error) {
        console.error('unread counts rpc failed:', error.message);
        return {};
      }

      const counts: Record<string, number> = {};
      for (const row of (data || []) as Array<{ group_id: string; count: number }>) {
        counts[row.group_id] = Number(row.count) || 0;
      }
      return counts;
    },
    enabled: !!user?.id && groupIds.length > 0,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useMarkAsRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('group_message_reads')
        .upsert(
          {
            group_id: groupId,
            user_id: user.id,
            last_read_at: new Date().toISOString(),
          },
          { onConflict: 'group_id,user_id' }
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unread-counts'] });
    },
  });
}
