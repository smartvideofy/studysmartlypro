import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useEffect } from "react";
import { toast } from "sonner";

export interface GroupMessage {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export function useGroupMessages(groupId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["group-messages", groupId],
    queryFn: async () => {
      // First get messages
      const { data: messages, error: messagesError } = await supabase
        .from("group_messages")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (messagesError) throw messagesError;

      // Get profiles for all message senders
      const userIds = [...new Set(messages?.map(m => m.user_id) || [])];
      if (userIds.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      if (profilesError) throw profilesError;

      // Merge profiles with messages
      const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      return messages.map(msg => ({
        ...msg,
        profiles: profilesMap.get(msg.user_id) || null,
      })) as GroupMessage[];
    },
    enabled: !!groupId,
  });

  // Real-time subscription
  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`group-chat-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "group_messages",
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["group-messages", groupId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, queryClient]);

  return query;
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, groupId }: { messageId: string; groupId: string }) => {
      const { error } = await supabase
        .from("group_messages")
        .delete()
        .eq("id", messageId);

      if (error) throw error;
      return groupId;
    },
    onSuccess: (groupId) => {
      queryClient.invalidateQueries({ queryKey: ["group-messages", groupId] });
    },
    onError: (error) => {
      toast.error("Failed to delete message: " + error.message);
    },
  });
}

export function useSendMessage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, content }: { groupId: string; content: string }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase.from("group_messages").insert({
        group_id: groupId,
        user_id: user.id,
        content,
      });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["group-messages", variables.groupId] });
    },
    onError: (error) => {
      toast.error("Failed to send message: " + error.message);
    },
  });
}
