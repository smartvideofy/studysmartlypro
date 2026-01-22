import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SearchResult {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
  reply_to_id: string | null;
  is_pinned: boolean;
  rank: number;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export function useMessageSearch(groupId: string) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const searchQuery = useQuery({
    queryKey: ["message-search", groupId, searchTerm],
    queryFn: async (): Promise<SearchResult[]> => {
      if (!searchTerm.trim()) return [];

      const { data, error } = await supabase
        .rpc("search_group_messages", {
          p_group_id: groupId,
          p_search_term: searchTerm,
          p_limit: 50,
        });

      if (error) throw error;

      // Fetch profiles for results
      if (data?.length) {
        const userIds = [...new Set(data.map((m: SearchResult) => m.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        
        return data.map((m: SearchResult) => ({
          ...m,
          profiles: profileMap.get(m.user_id) || null,
        }));
      }

      return data || [];
    },
    enabled: !!groupId && searchTerm.trim().length >= 2,
  });

  return {
    searchTerm,
    setSearchTerm,
    isSearching,
    setIsSearching,
    results: searchQuery.data || [],
    isLoading: searchQuery.isLoading,
  };
}
