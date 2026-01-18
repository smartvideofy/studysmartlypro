import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface ChatAttachment {
  id: string;
  message_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
}

export function useChatAttachments(groupId: string) {
  return useQuery({
    queryKey: ["chat-attachments", groupId],
    queryFn: async () => {
      const { data: messages, error: msgError } = await supabase
        .from("group_messages")
        .select("id")
        .eq("group_id", groupId);

      if (msgError) throw msgError;
      if (!messages?.length) return [];

      const messageIds = messages.map(m => m.id);
      
      const { data, error } = await supabase
        .from("group_message_attachments")
        .select("*")
        .in("message_id", messageIds);

      if (error) throw error;
      return data as ChatAttachment[];
    },
    enabled: !!groupId,
  });
}

export function useUploadAttachment() {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  const uploadAttachment = async (file: File, messageId: string): Promise<ChatAttachment | null> => {
    if (!user?.id) {
      toast.error("You must be logged in to upload files");
      return null;
    }

    setIsUploading(true);
    
    try {
      // Create unique file path
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${messageId}/${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("group-attachments")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Create attachment record
      const { data, error: insertError } = await supabase
        .from("group_message_attachments")
        .insert({
          message_id: messageId,
          file_name: file.name,
          file_path: fileName,
          file_size: file.size,
          mime_type: file.type,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return data as ChatAttachment;
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file: " + error.message);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadAttachment, isUploading };
}
