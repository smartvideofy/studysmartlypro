import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      groupId, 
      userId, 
      newRole 
    }: { 
      groupId: string; 
      userId: string; 
      newRole: 'admin' | 'member';
    }) => {
      const { error } = await supabase
        .from("group_members")
        .update({ role: newRole })
        .eq("group_id", groupId)
        .eq("user_id", userId);

      if (error) throw error;
      return { groupId, userId, newRole };
    },
    onSuccess: ({ groupId, newRole }) => {
      queryClient.invalidateQueries({ queryKey: ["group-members", groupId] });
      toast.success(newRole === 'admin' ? "Promoted to Admin" : "Demoted to Member");
    },
    onError: (error) => {
      toast.error("Failed to update role: " + error.message);
    },
  });
}
