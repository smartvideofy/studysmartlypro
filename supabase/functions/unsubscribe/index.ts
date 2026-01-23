import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface UnsubscribeRequest {
  token: string;
  preferences?: {
    weekly_progress?: boolean;
    streak_reminders?: boolean;
    achievement_alerts?: boolean;
    product_updates?: boolean;
    welcome_emails?: boolean;
  };
  unsubscribe_all?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Handle GET request - fetch current preferences
    if (req.method === "GET") {
      const url = new URL(req.url);
      const token = url.searchParams.get("token");
      
      if (!token) {
        return new Response(JSON.stringify({ error: "Token required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabase
        .from("email_preferences")
        .select("weekly_progress, streak_reminders, achievement_alerts, product_updates, welcome_emails")
        .eq("unsubscribe_token", token)
        .single();

      if (error || !data) {
        return new Response(JSON.stringify({ error: "Invalid token" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, preferences: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle POST request - update preferences
    if (req.method === "POST") {
      const { token, preferences, unsubscribe_all }: UnsubscribeRequest = await req.json();

      if (!token) {
        return new Response(JSON.stringify({ error: "Token required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify token exists first
      const { data: existing, error: fetchError } = await supabase
        .from("email_preferences")
        .select("id, user_id")
        .eq("unsubscribe_token", token)
        .single();

      if (fetchError || !existing) {
        return new Response(JSON.stringify({ error: "Invalid token" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Prepare update data
      const updateData = unsubscribe_all
        ? {
            weekly_progress: false,
            streak_reminders: false,
            achievement_alerts: false,
            product_updates: false,
            welcome_emails: false,
          }
        : preferences;

      if (!updateData) {
        return new Response(JSON.stringify({ error: "No preferences provided" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: updateError } = await supabase
        .from("email_preferences")
        .update(updateData)
        .eq("unsubscribe_token", token);

      if (updateError) {
        console.error("Update error:", updateError);
        return new Response(JSON.stringify({ error: "Failed to update preferences" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Log the unsubscribe action
      console.log(`Email preferences updated for user ${existing.user_id}:`, 
        unsubscribe_all ? "unsubscribed from all" : "preferences updated"
      );

      return new Response(JSON.stringify({ 
        success: true, 
        message: unsubscribe_all ? "Unsubscribed from all emails" : "Preferences updated" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in unsubscribe function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
