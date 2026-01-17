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
    queryKey: ['unread-counts', user?.id, groupIds],
    queryFn: async () => {
      if (!user?.id || groupIds.length === 0) return {};

      // Get last read times for all groups
      const { data: readData } = await supabase
        .from('group_message_reads')
        .select('group_id, last_read_at')
        .eq('user_id', user.id)
        .in('group_id', groupIds);

      const readMap = new Map(readData?.map(r => [r.group_id, r.last_read_at]) || []);

      // Get message counts for each group
      const counts: Record<string, number> = {};
      
      for (const groupId of groupIds) {
        const lastRead = readMap.get(groupId);
        
        let query = supabase
          .from('group_messages')
          .select('id', { count: 'exact', head: true })
          .eq('group_id', groupId)
          .neq('user_id', user.id);

        if (lastRead) {
          query = query.gt('created_at', lastRead);
        }

        const { count } = await query;
        counts[groupId] = count || 0;
      }

      return counts;
    },
    enabled: !!user?.id && groupIds.length > 0,
    refetchInterval: 30000, // Refetch every 30 seconds
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
