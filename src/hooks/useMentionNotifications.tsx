import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface MentionNotificationParams {
  groupId: string;
  groupName: string;
  mentionedNames: string[];
  senderName: string;
  messageContent: string;
}

export function useMentionNotifications() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      groupId, 
      groupName, 
      mentionedNames, 
      senderName, 
      messageContent 
    }: MentionNotificationParams) => {
      if (!user?.id || mentionedNames.length === 0) return;

      // Get all group members
      const { data: members, error: membersError } = await supabase
        .from("group_members")
        .select(`
          user_id,
          profiles:user_id (
            full_name
          )
        `)
        .eq("group_id", groupId);

      if (membersError) throw membersError;

      // Find user IDs for mentioned names
      const notifications = [];
      
      for (const member of members || []) {
        const memberName = (member.profiles as any)?.full_name;
        if (!memberName) continue;
        
        // Check if this member was mentioned
        const wasMentioned = mentionedNames.some(
          name => name.toLowerCase() === memberName.toLowerCase()
        );
        
        // Don't notify yourself
        if (wasMentioned && member.user_id !== user.id) {
          notifications.push({
            user_id: member.user_id,
            type: "mention",
            title: `${senderName} mentioned you`,
            message: `In ${groupName}: "${messageContent.substring(0, 50)}${messageContent.length > 50 ? "..." : ""}"`,
            data: { group_id: groupId },
          });
        }
      }

      if (notifications.length > 0) {
        const { error } = await supabase
          .from("notifications")
          .insert(notifications);

        if (error) throw error;
      }
    },
  });
}
