import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useEffect } from "react";

export interface ReadReceipt {
  id: string;
  message_id: string;
  user_id: string;
  read_at: string;
}

export interface MessageReadStatus {
  messageId: string;
  isDelivered: boolean;
  isReadByAll: boolean;
  readByCount: number;
  totalRecipients: number;
  readBy: { userId: string; readAt: string }[];
}

export function useReadReceipts(groupId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["read-receipts", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_read_receipts")
        .select(`
          id,
          message_id,
          user_id,
          read_at
        `)
        .in(
          "message_id",
          (await supabase
            .from("group_messages")
            .select("id")
            .eq("group_id", groupId)
          ).data?.map(m => m.id) || []
        );

      if (error) throw error;
      return data as ReadReceipt[];
    },
    enabled: !!groupId,
  });

  // Real-time subscription
  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`read-receipts-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_read_receipts",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["read-receipts", groupId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, queryClient]);

  const getReadStatusForMessage = (
    messageId: string, 
    senderId: string,
    memberCount: number
  ): MessageReadStatus => {
    const receipts = query.data?.filter(r => r.message_id === messageId) || [];
    const otherMemberCount = memberCount - 1; // Exclude sender
    
    return {
      messageId,
      isDelivered: true, // For now, assume delivered if sent
      isReadByAll: receipts.length >= otherMemberCount && otherMemberCount > 0,
      readByCount: receipts.length,
      totalRecipients: otherMemberCount,
      readBy: receipts.map(r => ({ userId: r.user_id, readAt: r.read_at })),
    };
  };

  return {
    ...query,
    getReadStatusForMessage,
  };
}

export function useMarkMessageAsRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, groupId }: { messageId: string; groupId: string }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("message_read_receipts")
        .upsert({
          message_id: messageId,
          user_id: user.id,
        }, {
          onConflict: "message_id,user_id",
        });

      if (error) throw error;
      return { messageId, groupId };
    },
    onSuccess: ({ groupId }) => {
      queryClient.invalidateQueries({ queryKey: ["read-receipts", groupId] });
    },
  });
}

export function useBulkMarkAsRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageIds, groupId }: { messageIds: string[]; groupId: string }) => {
      if (!user?.id || messageIds.length === 0) return;

      const receipts = messageIds.map(messageId => ({
        message_id: messageId,
        user_id: user.id,
      }));

      const { error } = await supabase
        .from("message_read_receipts")
        .upsert(receipts, {
          onConflict: "message_id,user_id",
        });

      if (error) throw error;
      return groupId;
    },
    onSuccess: (groupId) => {
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: ["read-receipts", groupId] });
      }
    },
  });
}
