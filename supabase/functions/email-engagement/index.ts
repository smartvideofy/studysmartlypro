import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the action from query params or body
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "all";

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const now = new Date();
    const results: { action: string; userId: string; status: string }[] = [];

    console.log(`Running engagement email job: action=${action} at ${now.toISOString()}`);

    // Helper to send email
    async function sendEmail(userId: string, template: string, data: Record<string, any> = {}) {
      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ user_id: userId, template, data }),
        });
        return await response.json();
      } catch (error) {
        console.error(`Failed to send ${template}:`, error);
        return { success: false, error };
      }
    }

    // 1. STREAK AT RISK - Users with active streak who haven't studied in 20+ hours
    if (action === "all" || action === "streak_at_risk") {
      console.log("Processing streak at risk emails...");

      const twentyHoursAgo = new Date(now.getTime() - 20 * 60 * 60 * 1000);
      
      // Get users with active streaks
      const { data: gamificationProfiles } = await supabase
        .from("gamification_profiles")
        .select("user_id, current_streak, last_activity_date")
        .gt("current_streak", 0)
        .lt("last_activity_date", twentyHoursAgo.toISOString());

      if (gamificationProfiles && gamificationProfiles.length > 0) {
        console.log(`Found ${gamificationProfiles.length} users with at-risk streaks`);

        for (const profile of gamificationProfiles) {
          // Check if we already sent this email today
          const todayStart = new Date(now);
          todayStart.setHours(0, 0, 0, 0);

          const { data: recentEmail } = await supabase
            .from("email_logs")
            .select("id")
            .eq("user_id", profile.user_id)
            .eq("template_name", "streak_at_risk")
            .gte("sent_at", todayStart.toISOString())
            .single();

          if (recentEmail) {
            console.log(`Already sent streak_at_risk to ${profile.user_id} today`);
            continue;
          }

          const result = await sendEmail(profile.user_id, "streak_at_risk", {
            streak: profile.current_streak,
          });

          results.push({
            action: "streak_at_risk",
            userId: profile.user_id,
            status: result.success ? "sent" : result.reason || "failed",
          });
        }
      }
    }

    // 2. WEEKLY PROGRESS - Send every Sunday
    if (action === "all" || action === "weekly_progress") {
      const dayOfWeek = now.getDay(); // 0 = Sunday
      
      if (dayOfWeek === 0 || action === "weekly_progress") {
        console.log("Processing weekly progress emails...");

        // Get all users with gamification profiles
        const { data: users } = await supabase
          .from("gamification_profiles")
          .select("user_id, total_xp, current_streak");

        if (users && users.length > 0) {
          // Get weekly stats for each user
          const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

          for (const user of users) {
            // Check if already sent this week
            const { data: recentEmail } = await supabase
              .from("email_logs")
              .select("id")
              .eq("user_id", user.user_id)
              .eq("template_name", "weekly_progress")
              .gte("sent_at", oneWeekAgo.toISOString())
              .single();

            if (recentEmail) {
              continue;
            }

            // Get weekly study stats
            const { data: sessions } = await supabase
              .from("study_sessions")
              .select("duration_minutes, cards_reviewed, xp_earned")
              .eq("user_id", user.user_id)
              .gte("started_at", oneWeekAgo.toISOString());

            const weeklyStats = (sessions || []).reduce(
              (acc, session) => ({
                studyMinutes: acc.studyMinutes + (session.duration_minutes || 0),
                cardsReviewed: acc.cardsReviewed + (session.cards_reviewed || 0),
                xpGained: acc.xpGained + (session.xp_earned || 0),
              }),
              { studyMinutes: 0, cardsReviewed: 0, xpGained: 0 }
            );

            // Only send if user had some activity
            if (weeklyStats.xpGained > 0 || weeklyStats.cardsReviewed > 0) {
              const result = await sendEmail(user.user_id, "weekly_progress", {
                ...weeklyStats,
                streak: user.current_streak,
              });

              results.push({
                action: "weekly_progress",
                userId: user.user_id,
                status: result.success ? "sent" : result.reason || "failed",
              });
            }
          }
        }
      }
    }

    // 3. REACTIVATION - Users inactive for 14+ days
    if (action === "all" || action === "reactivation") {
      console.log("Processing reactivation emails...");

      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const twentyOneDaysAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);

      // Get users inactive for 14-21 days (don't spam users who've been gone longer)
      const { data: inactiveUsers } = await supabase
        .from("gamification_profiles")
        .select("user_id, last_activity_date")
        .lt("last_activity_date", fourteenDaysAgo.toISOString())
        .gt("last_activity_date", twentyOneDaysAgo.toISOString());

      if (inactiveUsers && inactiveUsers.length > 0) {
        console.log(`Found ${inactiveUsers.length} inactive users`);

        for (const user of inactiveUsers) {
          // Check if we already sent a reactivation email
          const { data: recentEmail } = await supabase
            .from("email_logs")
            .select("id")
            .eq("user_id", user.user_id)
            .eq("template_name", "reactivation")
            .gte("sent_at", twentyOneDaysAgo.toISOString())
            .single();

          if (recentEmail) {
            continue;
          }

          const result = await sendEmail(user.user_id, "reactivation", {});

          results.push({
            action: "reactivation",
            userId: user.user_id,
            status: result.success ? "sent" : result.reason || "failed",
          });
        }
      }
    }

    const summary = {
      timestamp: now.toISOString(),
      action,
      processed: results.length,
      sent: results.filter((r) => r.status === "sent").length,
      skipped: results.filter((r) => r.status === "User opted out").length,
      failed: results.filter((r) => r.status === "failed").length,
      details: results,
    };

    console.log("Engagement job complete:", summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in email-engagement:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
