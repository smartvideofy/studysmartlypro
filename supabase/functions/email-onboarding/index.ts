import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface OnboardingEmail {
  day: number;
  template: string;
}

// Welcome email is now sent immediately on signup via database trigger
// This cron job handles the follow-up drip sequence
const ONBOARDING_SEQUENCE: OnboardingEmail[] = [
  { day: 2, template: "onboarding_day2" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth guard: only allow service role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.includes(SUPABASE_SERVICE_ROLE_KEY)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const now = new Date();
    const results: { template: string; userId: string; status: string }[] = [];

    console.log(`Running onboarding email job at ${now.toISOString()}`);

    for (const step of ONBOARDING_SEQUENCE) {
      // Calculate the date range for this step
      // Find users who signed up exactly 'step.day' days ago
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() - step.day);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      console.log(`Checking for ${step.template} (day ${step.day}): ${startOfDay.toISOString()} - ${endOfDay.toISOString()}`);

      // Get users who signed up on that day
      const { data: users, error: usersError } = await supabase
        .from("profiles")
        .select("user_id, created_at")
        .gte("created_at", startOfDay.toISOString())
        .lte("created_at", endOfDay.toISOString());

      if (usersError) {
        console.error(`Error fetching users for ${step.template}:`, usersError);
        continue;
      }

      if (!users || users.length === 0) {
        console.log(`No users found for ${step.template}`);
        continue;
      }

      console.log(`Found ${users.length} users for ${step.template}`);

      // Check which users haven't received this email yet
      for (const user of users) {
        // Check if already sent
        const { data: existingLog } = await supabase
          .from("email_logs")
          .select("id")
          .eq("user_id", user.user_id)
          .eq("template_name", step.template)
          .single();

        if (existingLog) {
          console.log(`User ${user.user_id} already received ${step.template}`);
          continue;
        }

        // Send the email via the send-email function
        try {
          const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({
              user_id: user.user_id,
              template: step.template,
            }),
          });

          const result = await response.json();
          results.push({
            template: step.template,
            userId: user.user_id,
            status: result.success ? "sent" : result.reason || "failed",
          });

          console.log(`Email ${step.template} to ${user.user_id}: ${result.success ? "sent" : "failed"}`);
        } catch (error) {
          console.error(`Failed to send ${step.template} to ${user.user_id}:`, error);
          results.push({
            template: step.template,
            userId: user.user_id,
            status: "error",
          });
        }
      }
    }

    const summary = {
      timestamp: now.toISOString(),
      processed: results.length,
      sent: results.filter((r) => r.status === "sent").length,
      skipped: results.filter((r) => r.status === "User opted out").length,
      failed: results.filter((r) => r.status === "failed" || r.status === "error").length,
      details: results,
    };

    console.log("Onboarding job complete:", summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in email-onboarding:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
