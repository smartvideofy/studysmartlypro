import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useEffect } from "react";
import { toast } from "sonner";

export interface MessageAttachment {
  id: string;
  message_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
}

export interface GroupMessage {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
  reply_to_id: string | null;
  is_pinned?: boolean;
  pinned_at?: string | null;
  pinned_by?: string | null;
  is_edited?: boolean;
  edited_at?: string | null;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  reply_to?: {
    id: string;
    content: string;
    user_id: string;
    profiles?: {
      full_name: string | null;
    };
  } | null;
  attachments?: MessageAttachment[];
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
      if (!messages?.length) return [];

      // Get profiles for all message senders
      const userIds = [...new Set(messages.map(m => m.user_id))];
      const replyIds = messages.filter(m => m.reply_to_id).map(m => m.reply_to_id);

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      if (profilesError) throw profilesError;

      // Get reply-to messages if any
      let replyMessages: any[] = [];
      if (replyIds.length > 0) {
        const { data: replies, error: repliesError } = await supabase
          .from("group_messages")
          .select("id, content, user_id")
          .in("id", replyIds);
        
        if (!repliesError && replies) {
          replyMessages = replies;
        }
      }

      // Get attachments for all messages
      const messageIds = messages.map(m => m.id);
      const { data: attachments, error: attachmentsError } = await supabase
        .from("group_message_attachments")
        .select("*")
        .in("message_id", messageIds);

      if (attachmentsError) console.error("Attachments error:", attachmentsError);

      // Merge everything
      const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const repliesMap = new Map(replyMessages.map(r => [r.id, r]));
      const attachmentsMap = new Map<string, MessageAttachment[]>();
      
      (attachments || []).forEach(att => {
        if (!attachmentsMap.has(att.message_id)) {
          attachmentsMap.set(att.message_id, []);
        }
        attachmentsMap.get(att.message_id)!.push(att);
      });

      return messages.map(msg => {
        const replyTo = msg.reply_to_id ? repliesMap.get(msg.reply_to_id) : null;
        return {
          ...msg,
          profiles: profilesMap.get(msg.user_id) || null,
          reply_to: replyTo ? {
            ...replyTo,
            profiles: profilesMap.get(replyTo.user_id) || null,
          } : null,
          attachments: attachmentsMap.get(msg.id) || [],
        };
      }) as GroupMessage[];
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
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "group_message_attachments",
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

interface SendMessageParams {
  groupId: string;
  content: string;
  replyToId?: string | null;
}

export function useSendMessage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, content, replyToId }: SendMessageParams) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("group_messages")
        .insert({
          group_id: groupId,
          user_id: user.id,
          content,
          reply_to_id: replyToId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["group-messages", variables.groupId] });
    },
    onError: (error) => {
      toast.error("Failed to send message: " + error.message);
    },
  });
}
