import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface SharedNote {
  id: string;
  note_id: string;
  group_id: string;
  shared_by: string;
  shared_at: string;
  notes?: {
    id: string;
    title: string;
    content: string | null;
    updated_at: string;
  };
}

export function useSharedNotes(groupId: string) {
  return useQuery({
    queryKey: ["shared-notes", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shared_notes")
        .select("*, notes(id, title, content, updated_at)")
        .eq("group_id", groupId)
        .order("shared_at", { ascending: false });

      if (error) throw error;
      return data as SharedNote[];
    },
    enabled: !!groupId,
  });
}

export function useShareNote() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, groupId }: { noteId: string; groupId: string }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase.from("shared_notes").insert({
        note_id: noteId,
        group_id: groupId,
        shared_by: user.id,
      });

      if (error) throw error;

      // Notify group members about the shared note
      try {
        const [{ data: group }, { data: note }, { data: profile }] = await Promise.all([
          supabase.from("study_groups").select("name").eq("id", groupId).single(),
          supabase.from("notes").select("title").eq("id", noteId).single(),
          supabase.from("profiles").select("full_name").eq("user_id", user.id).single(),
        ]);
        const sharerName = profile?.full_name || "Someone";
        const groupName = group?.name || "the group";

        await supabase.rpc("notify_group_members", {
          p_group_id: groupId,
          p_sender_id: user.id,
          p_type: "shared_note",
          p_title: `${sharerName} shared "${note?.title || "a note"}" in ${groupName}`,
          p_message: "",
          p_data: { group_id: groupId, note_id: noteId },
        });
      } catch (notifError) {
        console.error("Failed to send share notifications:", notifError);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["shared-notes", variables.groupId] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Note shared with group");
    },
    onError: (error) => {
      toast.error("Failed to share note: " + error.message);
    },
  });
}

export function useUnshareNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, groupId }: { noteId: string; groupId: string }) => {
      const { error } = await supabase
        .from("shared_notes")
        .delete()
        .eq("note_id", noteId)
        .eq("group_id", groupId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["shared-notes", variables.groupId] });
      toast.success("Note unshared");
    },
    onError: (error) => {
      toast.error("Failed to unshare note: " + error.message);
    },
  });
}
