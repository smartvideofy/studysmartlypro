import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export function useEditMessage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      messageId, 
      groupId, 
      newContent 
    }: { 
      messageId: string; 
      groupId: string; 
      newContent: string 
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Verify ownership and edit window (15 minutes)
      const { data: message, error: fetchError } = await supabase
        .from("group_messages")
        .select("user_id, created_at")
        .eq("id", messageId)
        .single();

      if (fetchError) throw fetchError;
      if (message.user_id !== user.id) {
        throw new Error("You can only edit your own messages");
      }

      const createdAt = new Date(message.created_at);
      const now = new Date();
      const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
      
      if (diffMinutes > 15) {
        throw new Error("Messages can only be edited within 15 minutes");
      }

      const { error } = await supabase
        .from("group_messages")
        .update({ 
          content: newContent,
          is_edited: true,
          edited_at: new Date().toISOString()
        })
        .eq("id", messageId);

      if (error) throw error;
      return groupId;
    },
    onSuccess: (groupId) => {
      queryClient.invalidateQueries({ queryKey: ["group-messages", groupId] });
      toast.success("Message updated");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
