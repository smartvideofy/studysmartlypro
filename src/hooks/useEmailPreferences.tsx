import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface EmailPreferences {
  id: string;
  user_id: string;
  welcome_emails: boolean;
  weekly_progress: boolean;
  streak_reminders: boolean;
  achievement_alerts: boolean;
  product_updates: boolean;
  unsubscribe_token: string;
  created_at: string;
  updated_at: string;
}

export function useEmailPreferences() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["email-preferences", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("email_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        // If no preferences exist, create them
        if (error.code === "PGRST116") {
          const { data: newPrefs, error: insertError } = await supabase
            .from("email_preferences")
            .insert({ user_id: user.id })
            .select()
            .single();

          if (insertError) throw insertError;
          return newPrefs as EmailPreferences;
        }
        throw error;
      }

      return data as EmailPreferences;
    },
    enabled: !!user?.id,
  });
}

export function useUpdateEmailPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<Omit<EmailPreferences, "id" | "user_id" | "unsubscribe_token" | "created_at" | "updated_at">>) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("email_preferences")
        .update(updates)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data as EmailPreferences;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-preferences"] });
      toast.success("Email preferences updated");
    },
    onError: (error) => {
      console.error("Failed to update email preferences:", error);
      toast.error("Failed to update preferences");
    },
  });
}

// Hook for unsubscribe page - doesn't require auth
export function useUnsubscribe() {
  return useMutation({
    mutationFn: async ({ token, preferences }: { 
      token: string; 
      preferences?: Partial<Omit<EmailPreferences, "id" | "user_id" | "unsubscribe_token" | "created_at" | "updated_at">> 
    }) => {
      // For unsubscribe, we need to use a public endpoint or handle via edge function
      // For now, we'll update based on the token
      const { data, error } = await supabase
        .from("email_preferences")
        .update(preferences || {
          welcome_emails: false,
          weekly_progress: false,
          streak_reminders: false,
          achievement_alerts: false,
          product_updates: false,
        })
        .eq("unsubscribe_token", token)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Successfully unsubscribed");
    },
    onError: (error) => {
      console.error("Failed to unsubscribe:", error);
      toast.error("Failed to unsubscribe");
    },
  });
}
