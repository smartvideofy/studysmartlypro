import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface BlockedUser {
  blocked_id: string;
  created_at: string;
  profile?: { user_id: string; full_name: string | null; avatar_url: string | null } | null;
}

export function useBlockedUsers() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["blocked-users", user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as BlockedUser[];
      const { data, error } = await supabase
        .from("user_blocks")
        .select("blocked_id, created_at")
        .eq("blocker_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as { blocked_id: string; created_at: string }[];
      if (rows.length === 0) return [] as BlockedUser[];

      const ids = rows.map((r) => r.blocked_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", ids);
      const map = new Map((profiles ?? []).map((p) => [p.user_id, p]));
      return rows.map((r) => ({ ...r, profile: map.get(r.blocked_id) ?? null }));
    },
    enabled: !!user?.id,
  });
}

/** Fast lookup set of blocked user ids for chat filtering. */
export function useBlockedIds(): Set<string> {
  const { data } = useBlockedUsers();
  return new Set((data ?? []).map((b) => b.blocked_id));
}

export function useBlockUser() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (blockedId: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      if (blockedId === user.id) throw new Error("You cannot block yourself");
      const { error } = await supabase
        .from("user_blocks")
        .insert({ blocker_id: user.id, blocked_id: blockedId });
      if (error && !error.message.includes("duplicate")) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blocked-users"] });
      toast.success("User blocked. You won't see their messages.");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to block user"),
  });
}

export function useUnblockUser() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (blockedId: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("user_blocks")
        .delete()
        .eq("blocker_id", user.id)
        .eq("blocked_id", blockedId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blocked-users"] });
      toast.success("User unblocked");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to unblock"),
  });
}

export type ReportTargetType = "message" | "user" | "group";

export function useReportContent() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (params: {
      contentType: ReportTargetType;
      contentId: string;
      reportedUserId?: string;
      reason: string;
      details?: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase.from("content_reports").insert({
        reporter_id: user.id,
        content_type: params.contentType,
        content_id: params.contentId,
        reported_user_id: params.reportedUserId ?? null,
        reason: params.reason,
        details: params.details ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Report submitted. Thank you for helping keep Studily safe.");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to submit report"),
  });
}
