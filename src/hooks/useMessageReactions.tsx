import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useEffect } from "react";
import { toast } from "sonner";

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface ReactionSummary {
  emoji: string;
  count: number;
  users: string[];
  hasReacted: boolean;
}

export function useMessageReactions(groupId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["message-reactions", groupId],
    queryFn: async () => {
      // Get all message IDs for this group first
      const { data: messages, error: messagesError } = await supabase
        .from("group_messages")
        .select("id")
        .eq("group_id", groupId);

      if (messagesError) throw messagesError;
      if (!messages?.length) return [];

      const messageIds = messages.map(m => m.id);

      const { data, error } = await supabase
        .from("message_reactions")
        .select("*")
        .in("message_id", messageIds);

      if (error) throw error;
      return data as MessageReaction[];
    },
    enabled: !!groupId,
  });

  // Real-time subscription for reactions
  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`reactions-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_reactions",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["message-reactions", groupId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, queryClient]);

  // Helper to get reactions for a specific message
  const getReactionsForMessage = (messageId: string): ReactionSummary[] => {
    if (!query.data) return [];

    const messageReactions = query.data.filter(r => r.message_id === messageId);
    const emojiMap = new Map<string, { count: number; users: string[]; hasReacted: boolean }>();

    messageReactions.forEach(reaction => {
      const existing = emojiMap.get(reaction.emoji);
      if (existing) {
        existing.count++;
        existing.users.push(reaction.user_id);
        if (reaction.user_id === user?.id) {
          existing.hasReacted = true;
        }
      } else {
        emojiMap.set(reaction.emoji, {
          count: 1,
          users: [reaction.user_id],
          hasReacted: reaction.user_id === user?.id,
        });
      }
    });

    return Array.from(emojiMap.entries()).map(([emoji, data]) => ({
      emoji,
      ...data,
    }));
  };

  return { ...query, getReactionsForMessage };
}

export function useToggleReaction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, emoji, groupId }: { messageId: string; emoji: string; groupId: string }) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Check if reaction already exists
      const { data: existing } = await supabase
        .from("message_reactions")
        .select("id")
        .eq("message_id", messageId)
        .eq("user_id", user.id)
        .eq("emoji", emoji)
        .single();

      if (existing) {
        // Remove reaction
        const { error } = await supabase
          .from("message_reactions")
          .delete()
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        // Add reaction
        const { error } = await supabase
          .from("message_reactions")
          .insert({
            message_id: messageId,
            user_id: user.id,
            emoji,
          });
        if (error) throw error;
      }

      return groupId;
    },
    onSuccess: (groupId) => {
      queryClient.invalidateQueries({ queryKey: ["message-reactions", groupId] });
    },
    onError: (error) => {
      toast.error("Failed to update reaction: " + error.message);
    },
  });
}
