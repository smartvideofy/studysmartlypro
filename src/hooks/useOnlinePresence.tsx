import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface OnlineUser {
  id: string;
  name: string;
  avatar_url?: string;
  online_at: string;
}

export function useOnlinePresence(groupId: string) {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    if (!groupId || !user?.id) return;

    const channel = supabase.channel(`presence-${groupId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users: OnlineUser[] = [];
        
        Object.entries(state).forEach(([key, presences]) => {
          if (Array.isArray(presences) && presences.length > 0) {
            const presence = presences[0] as Record<string, unknown>;
            users.push({
              id: key,
              name: (presence.name as string) || "Unknown",
              avatar_url: presence.avatar_url as string | undefined,
              online_at: (presence.online_at as string) || new Date().toISOString(),
            });
          }
        });
        
        setOnlineUsers(users);
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        // User joined presence
        if (import.meta.env.DEV) {
          console.log("User joined:", key, newPresences);
        }
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        // User left presence
        if (import.meta.env.DEV) {
          console.log("User left:", key, leftPresences);
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Get user profile info
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("user_id", user.id)
            .single();

          await channel.track({
            name: profile?.full_name || user.email?.split("@")[0] || "User",
            avatar_url: profile?.avatar_url,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, user?.id, user?.email]);

  const isOnline = (userId: string) => onlineUsers.some(u => u.id === userId);

  return { onlineUsers, isOnline };
}
