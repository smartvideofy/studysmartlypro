import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface PinnedMessage {
  id: string;
  content: string;
  created_at: string;
  pinned_at: string;
  pinned_by: string;
  user_id: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  pinner?: {
    full_name: string | null;
  };
}

export function usePinnedMessages(groupId: string) {
  return useQuery({
    queryKey: ["pinned-messages", groupId],
    queryFn: async () => {
      const { data: messages, error } = await supabase
        .from("group_messages")
        .select("id, content, created_at, pinned_at, pinned_by, user_id")
        .eq("group_id", groupId)
        .eq("is_pinned", true)
        .order("pinned_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles
      if (messages?.length) {
        const userIds = [...new Set([
          ...messages.map(m => m.user_id),
          ...messages.filter(m => m.pinned_by).map(m => m.pinned_by),
        ])];
        
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        
        return messages.map(m => ({
          ...m,
          profiles: profileMap.get(m.user_id) || null,
          pinner: m.pinned_by ? profileMap.get(m.pinned_by) || null : null,
        })) as PinnedMessage[];
      }

      return messages as PinnedMessage[];
    },
    enabled: !!groupId,
  });
}

export function useTogglePin() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, groupId, isPinned }: { messageId: string; groupId: string; isPinned: boolean }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("group_messages")
        .update({
          is_pinned: !isPinned,
          pinned_by: !isPinned ? user.id : null,
          pinned_at: !isPinned ? new Date().toISOString() : null,
        })
        .eq("id", messageId);

      if (error) throw error;
      return { groupId, wasUnpinned: isPinned };
    },
    onSuccess: ({ groupId, wasUnpinned }) => {
      queryClient.invalidateQueries({ queryKey: ["pinned-messages", groupId] });
      queryClient.invalidateQueries({ queryKey: ["group-messages", groupId] });
      toast.success(wasUnpinned ? "Message unpinned" : "Message pinned");
    },
    onError: (error) => {
      toast.error("Failed to update pin: " + error.message);
    },
  });
}
