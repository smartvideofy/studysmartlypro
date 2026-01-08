import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "./useAuth";

export interface NoteAttachment {
  id: string;
  note_id: string;
  user_id: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  object_path: string;
  bucket_id: string;
  created_at: string;
}

export function useNoteAttachments(noteId: string) {
  return useQuery({
    queryKey: ["note-attachments", noteId],
    queryFn: async () => {
      if (!noteId) return [];
      
      const { data, error } = await supabase
        .from("note_attachments")
        .select("*")
        .eq("note_id", noteId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as NoteAttachment[];
    },
    enabled: !!noteId,
  });
}

export function useUploadNoteAttachment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ noteId, file }: { noteId: string; file: File }) => {
      if (!user) throw new Error("Not authenticated");

      // Generate unique path: userId/noteId/uuid-filename
      const fileExt = file.name.split(".").pop();
      const uniqueId = crypto.randomUUID();
      const objectPath = `${user.id}/${noteId}/${uniqueId}-${file.name}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("note-attachments")
        .upload(objectPath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Insert metadata
      const { data, error: metadataError } = await supabase
        .from("note_attachments")
        .insert({
          note_id: noteId,
          user_id: user.id,
          file_name: file.name,
          mime_type: file.type || null,
          size_bytes: file.size,
          object_path: objectPath,
          bucket_id: "note-attachments",
        })
        .select()
        .single();

      if (metadataError) {
        // Cleanup: delete uploaded file if metadata insert fails
        await supabase.storage.from("note-attachments").remove([objectPath]);
        throw metadataError;
      }

      return data as NoteAttachment;
    },
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: ["note-attachments", noteId] });
      toast.success("File uploaded successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to upload file. Please try again.");
    },
  });
}

export function useDeleteNoteAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (attachment: NoteAttachment) => {
      // Delete from storage first
      const { error: storageError } = await supabase.storage
        .from(attachment.bucket_id)
        .remove([attachment.object_path]);

      if (storageError) {
        // Continue anyway to clean up metadata - storage file may already be deleted
      }

      // Delete metadata
      const { error: metadataError } = await supabase
        .from("note_attachments")
        .delete()
        .eq("id", attachment.id);

      if (metadataError) throw metadataError;

      return attachment;
    },
    onSuccess: (attachment) => {
      queryClient.invalidateQueries({ queryKey: ["note-attachments", attachment.note_id] });
      toast.success("File deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete file. Please try again.");
    },
  });
}

export function useSignedAttachmentUrl(objectPath: string | null) {
  return useQuery({
    queryKey: ["attachment-url", objectPath],
    queryFn: async () => {
      if (!objectPath) return null;

      const { data, error } = await supabase.storage
        .from("note-attachments")
        .createSignedUrl(objectPath, 3600); // 1 hour expiry

      if (error) throw error;
      return data.signedUrl;
    },
    enabled: !!objectPath,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });
}
