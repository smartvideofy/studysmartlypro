import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface GroupPoll {
  id: string;
  group_id: string;
  question: string;
  created_by: string;
  ends_at: string | null;
  is_anonymous: boolean;
  allow_multiple: boolean;
  is_closed: boolean;
  created_at: string;
  creator?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  options: PollOption[];
  votes: PollVote[];
  total_votes: number;
}

export interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  position: number;
  vote_count: number;
}

export interface PollVote {
  id: string;
  poll_id: string;
  option_id: string;
  user_id: string;
}

export function useGroupPolls(groupId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["group-polls", groupId],
    queryFn: async () => {
      // Fetch polls
      const { data: polls, error: pollsError } = await supabase
        .from("group_polls")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false });

      if (pollsError) throw pollsError;
      if (!polls?.length) return [];

      // Fetch options for all polls
      const pollIds = polls.map(p => p.id);
      const { data: options, error: optionsError } = await supabase
        .from("poll_options")
        .select("*")
        .in("poll_id", pollIds)
        .order("position", { ascending: true });

      if (optionsError) throw optionsError;

      // Fetch all votes
      const { data: votes, error: votesError } = await supabase
        .from("poll_votes")
        .select("*")
        .in("poll_id", pollIds);

      if (votesError) throw votesError;

      // Fetch creator profiles
      const creatorIds = [...new Set(polls.map(p => p.created_by))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", creatorIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Combine data
      return polls.map(poll => {
        const pollOptions = (options || [])
          .filter(o => o.poll_id === poll.id)
          .map(o => ({
            ...o,
            vote_count: (votes || []).filter(v => v.option_id === o.id).length
          }));

        const pollVotes = (votes || []).filter(v => v.poll_id === poll.id);

        return {
          ...poll,
          creator: profileMap.get(poll.created_by) || null,
          options: pollOptions,
          votes: pollVotes,
          total_votes: pollVotes.length,
        } as GroupPoll;
      });
    },
    enabled: !!groupId && !!user,
  });
}

export function useCreatePoll() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      groupId: string;
      question: string;
      options: string[];
      endsAt?: Date;
      isAnonymous?: boolean;
      allowMultiple?: boolean;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Create poll
      const { data: poll, error: pollError } = await supabase
        .from("group_polls")
        .insert({
          group_id: params.groupId,
          question: params.question,
          created_by: user.id,
          ends_at: params.endsAt?.toISOString() || null,
          is_anonymous: params.isAnonymous || false,
          allow_multiple: params.allowMultiple || false,
        })
        .select()
        .single();

      if (pollError) throw pollError;

      // Create options
      const optionsToInsert = params.options.map((text, index) => ({
        poll_id: poll.id,
        option_text: text,
        position: index,
      }));

      const { error: optionsError } = await supabase
        .from("poll_options")
        .insert(optionsToInsert);

      if (optionsError) throw optionsError;

      return poll;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["group-polls", variables.groupId] });
      toast.success("Poll created!");
    },
    onError: (error) => {
      toast.error("Failed to create poll: " + error.message);
    },
  });
}

export function useVotePoll() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pollId, optionId, groupId }: { 
      pollId: string; 
      optionId: string; 
      groupId: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Check if user already voted for this option
      const { data: existingVote } = await supabase
        .from("poll_votes")
        .select("id")
        .eq("poll_id", pollId)
        .eq("option_id", optionId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingVote) {
        // Remove vote (toggle)
        const { error } = await supabase
          .from("poll_votes")
          .delete()
          .eq("id", existingVote.id);
        if (error) throw error;
        return { action: 'removed' };
      } else {
        // Add vote
        const { error } = await supabase
          .from("poll_votes")
          .insert({
            poll_id: pollId,
            option_id: optionId,
            user_id: user.id,
          });
        if (error) throw error;
        return { action: 'added' };
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["group-polls", variables.groupId] });
    },
    onError: (error) => {
      toast.error("Failed to vote: " + error.message);
    },
  });
}

export function useClosePoll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pollId, groupId }: { pollId: string; groupId: string }) => {
      const { error } = await supabase
        .from("group_polls")
        .update({ is_closed: true })
        .eq("id", pollId);

      if (error) throw error;
      return groupId;
    },
    onSuccess: (groupId) => {
      queryClient.invalidateQueries({ queryKey: ["group-polls", groupId] });
      toast.success("Poll closed");
    },
    onError: (error) => {
      toast.error("Failed to close poll: " + error.message);
    },
  });
}

export function useDeletePoll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pollId, groupId }: { pollId: string; groupId: string }) => {
      const { error } = await supabase
        .from("group_polls")
        .delete()
        .eq("id", pollId);

      if (error) throw error;
      return groupId;
    },
    onSuccess: (groupId) => {
      queryClient.invalidateQueries({ queryKey: ["group-polls", groupId] });
      toast.success("Poll deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete poll: " + error.message);
    },
  });
}
