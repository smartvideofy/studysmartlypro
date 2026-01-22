import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface GroupStudySession {
  id: string;
  group_id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
  meeting_link: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface SessionRSVP {
  id: string;
  session_id: string;
  user_id: string;
  status: 'going' | 'maybe' | 'not_going';
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export function useGroupStudySessions(groupId: string) {
  return useQuery({
    queryKey: ["group-study-sessions", groupId],
    queryFn: async () => {
      const { data: sessions, error } = await supabase
        .from("group_study_sessions")
        .select("*")
        .eq("group_id", groupId)
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true });

      if (error) throw error;

      // Fetch creator profiles
      if (sessions?.length) {
        const creatorIds = [...new Set(sessions.map(s => s.created_by))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", creatorIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        
        return sessions.map(s => ({
          ...s,
          creator: profileMap.get(s.created_by) || null,
        })) as GroupStudySession[];
      }

      return sessions as GroupStudySession[];
    },
    enabled: !!groupId,
  });
}

export function useSessionRSVPs(sessionId: string) {
  return useQuery({
    queryKey: ["session-rsvps", sessionId],
    queryFn: async () => {
      const { data: rsvps, error } = await supabase
        .from("study_session_rsvps")
        .select("*")
        .eq("session_id", sessionId);

      if (error) throw error;

      // Fetch profiles for RSVPs
      if (rsvps?.length) {
        const userIds = rsvps.map(r => r.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        
        return rsvps.map(r => ({
          ...r,
          profile: profileMap.get(r.user_id) || null,
        })) as SessionRSVP[];
      }

      return rsvps as SessionRSVP[];
    },
    enabled: !!sessionId,
  });
}

export function useCreateGroupStudySession() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      groupId: string;
      title: string;
      description?: string;
      scheduledAt: Date;
      durationMinutes: number;
      meetingLink?: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("group_study_sessions")
        .insert({
          group_id: params.groupId,
          title: params.title,
          description: params.description || null,
          scheduled_at: params.scheduledAt.toISOString(),
          duration_minutes: params.durationMinutes,
          meeting_link: params.meetingLink || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["group-study-sessions", variables.groupId] });
      toast.success("Study session scheduled!");
    },
    onError: (error) => {
      toast.error("Failed to create session: " + error.message);
    },
  });
}

export function useUpdateRSVP() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, status }: { sessionId: string; status: 'going' | 'maybe' | 'not_going' }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("study_session_rsvps")
        .upsert({
          session_id: sessionId,
          user_id: user.id,
          status,
        }, {
          onConflict: 'session_id,user_id',
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["session-rsvps", variables.sessionId] });
    },
    onError: (error) => {
      toast.error("Failed to update RSVP: " + error.message);
    },
  });
}

export function useDeleteGroupStudySession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, groupId }: { sessionId: string; groupId: string }) => {
      const { error } = await supabase
        .from("group_study_sessions")
        .delete()
        .eq("id", sessionId);

      if (error) throw error;
      return groupId;
    },
    onSuccess: (groupId) => {
      queryClient.invalidateQueries({ queryKey: ["group-study-sessions", groupId] });
      toast.success("Session deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete session: " + error.message);
    },
  });
}
