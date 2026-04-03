import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Helper to send email with duplicate protection
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

// Helper to check if email was recently sent
async function wasRecentlySent(
  supabase: any,
  now: Date,
  userId: string,
  template: string,
  withinHours: number = 24
): Promise<boolean> {
  const since = new Date(now.getTime() - withinHours * 60 * 60 * 1000);
  const { data } = await supabase
    .from("email_logs")
    .select("id")
    .eq("user_id", userId)
    .eq("template_name", template)
    .gte("sent_at", since.toISOString())
    .limit(1);
  return !!data?.length;
}

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

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "all";

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const now = new Date();
    const results: { action: string; userId: string; status: string }[] = [];

    console.log(`Running engagement email job: action=${action} at ${now.toISOString()}`);

    // ============ 1. ABANDONED CHECKOUT RECOVERY ============
    if (action === "all" || action === "abandoned_checkout") {
      console.log("Processing abandoned checkout emails...");

      const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);

      // Get pending payment attempts older than 1 hour
      const { data: pendingAttempts } = await supabase
        .from("payment_attempts")
        .select("id, user_id, plan, billing_interval, amount, created_at")
        .eq("status", "pending")
        .lt("created_at", oneHourAgo.toISOString())
        .gt("created_at", seventyTwoHoursAgo.toISOString());

      if (pendingAttempts && pendingAttempts.length > 0) {
        console.log(`Found ${pendingAttempts.length} abandoned checkouts`);

        for (const attempt of pendingAttempts) {
          const attemptAge = now.getTime() - new Date(attempt.created_at).getTime();
          const hoursOld = attemptAge / (60 * 60 * 1000);

          // First email at 1hr, second at 24hr
          if (hoursOld >= 1 && hoursOld < 24) {
            if (await wasRecentlySent(supabase, now, attempt.user_id, "abandoned_checkout", 23)) continue;
          } else if (hoursOld >= 24) {
            // Check if second reminder already sent
            const since24h = new Date(now.getTime() - 48 * 60 * 60 * 1000);
            const { data: logs } = await supabase
              .from("email_logs")
              .select("id")
              .eq("user_id", attempt.user_id)
              .eq("template_name", "abandoned_checkout")
              .gte("sent_at", since24h.toISOString());
            if (logs && logs.length >= 2) continue; // Already sent both
          }

          const planName = attempt.plan === "pro" ? "Studily Pro" : "Studily Team";
          const result = await sendEmail(attempt.user_id, "abandoned_checkout", {
            planName,
            amount: attempt.amount,
            billingInterval: attempt.billing_interval,
          });

          results.push({
            action: "abandoned_checkout",
            userId: attempt.user_id,
            status: result.success ? "sent" : result.reason || "failed",
          });
        }
      }
    }

    // ============ 2. STREAK AT RISK ============
    if (action === "all" || action === "streak_at_risk") {
      console.log("Processing streak at risk emails...");

      const twentyHoursAgo = new Date(now.getTime() - 20 * 60 * 60 * 1000);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, streak_days, last_study_date")
        .gt("streak_days", 0)
        .lt("last_study_date", twentyHoursAgo.toISOString());

      if (profiles && profiles.length > 0) {
        console.log(`Found ${profiles.length} users with at-risk streaks`);

        for (const profile of profiles) {
          if (await wasRecentlySent(supabase, now, profile.user_id, "streak_at_risk", 24)) continue;

          const result = await sendEmail(profile.user_id, "streak_at_risk", {
            streak: profile.streak_days,
          });

          results.push({
            action: "streak_at_risk",
            userId: profile.user_id,
            status: result.success ? "sent" : result.reason || "failed",
          });
        }
      }
    }

    // ============ 3. STREAK LOST ============
    if (action === "all" || action === "streak_lost") {
      console.log("Processing streak lost emails...");

      const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      // Users whose streak is 0 but studied within last 48 hours (just lost it)
      const { data: lostStreaks } = await supabase
        .from("profiles")
        .select("user_id, last_study_date")
        .eq("streak_days", 0)
        .gt("last_study_date", fortyEightHoursAgo.toISOString());

      if (lostStreaks && lostStreaks.length > 0) {
        console.log(`Found ${lostStreaks.length} users who just lost streaks`);

        for (const profile of lostStreaks) {
          if (await wasRecentlySent(supabase, now, profile.user_id, "streak_lost", 72)) continue;

          const result = await sendEmail(profile.user_id, "streak_lost", {
            previousStreak: 0, // We don't track previous streak, so just encourage
          });

          results.push({
            action: "streak_lost",
            userId: profile.user_id,
            status: result.success ? "sent" : result.reason || "failed",
          });
        }
      }
    }

    // ============ 4. EARLY CHURN NUDGES (3-day and 7-day) ============
    if (action === "all" || action === "nudge_inactive") {
      console.log("Processing early churn nudge emails...");

      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);

      // 3-day nudge: inactive 3-4 days
      const { data: nudge3Users } = await supabase
        .from("profiles")
        .select("user_id, last_study_date")
        .lt("last_study_date", threeDaysAgo.toISOString())
        .gt("last_study_date", fourDaysAgo.toISOString());

      if (nudge3Users && nudge3Users.length > 0) {
        console.log(`Found ${nudge3Users.length} users for 3-day nudge`);
        for (const user of nudge3Users) {
          if (await wasRecentlySent(supabase, now, user.user_id, "nudge_3day", 72)) continue;
          const result = await sendEmail(user.user_id, "nudge_3day", {});
          results.push({
            action: "nudge_3day",
            userId: user.user_id,
            status: result.success ? "sent" : result.reason || "failed",
          });
        }
      }

      // 7-day nudge: inactive 7-8 days
      const { data: nudge7Users } = await supabase
        .from("profiles")
        .select("user_id, last_study_date")
        .lt("last_study_date", sevenDaysAgo.toISOString())
        .gt("last_study_date", eightDaysAgo.toISOString());

      if (nudge7Users && nudge7Users.length > 0) {
        console.log(`Found ${nudge7Users.length} users for 7-day nudge`);
        for (const user of nudge7Users) {
          if (await wasRecentlySent(supabase, now, user.user_id, "nudge_7day", 7 * 24)) continue;
          const result = await sendEmail(user.user_id, "nudge_7day", {});
          results.push({
            action: "nudge_7day",
            userId: user.user_id,
            status: result.success ? "sent" : result.reason || "failed",
          });
        }
      }
    }

    // ============ 5. WEEKLY PROGRESS ============
    if (action === "all" || action === "weekly_progress") {
      const dayOfWeek = now.getDay();

      if (dayOfWeek === 0 || action === "weekly_progress") {
        console.log("Processing weekly progress emails...");

        const { data: users } = await supabase
          .from("profiles")
          .select("user_id, xp, streak_days");

        if (users && users.length > 0) {
          const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

          for (const user of users) {
            if (await wasRecentlySent(supabase, now, user.user_id, "weekly_progress", 7 * 24)) continue;

            const { data: sessions } = await supabase
              .from("study_sessions")
              .select("total_time_seconds, cards_studied")
              .eq("user_id", user.user_id)
              .gte("started_at", oneWeekAgo.toISOString());

            const weeklyStats = (sessions || []).reduce(
              (acc: any, session: any) => ({
                studyMinutes: acc.studyMinutes + Math.round((session.total_time_seconds || 0) / 60),
                cardsReviewed: acc.cardsReviewed + (session.cards_studied || 0),
              }),
              { studyMinutes: 0, cardsReviewed: 0 }
            );

            if (weeklyStats.cardsReviewed > 0 || weeklyStats.studyMinutes > 0) {
              const result = await sendEmail(user.user_id, "weekly_progress", {
                ...weeklyStats,
                xpGained: user.xp || 0,
                streak: user.streak_days,
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

    // ============ 6. REACTIVATION (14-21 days inactive) ============
    if (action === "all" || action === "reactivation") {
      console.log("Processing reactivation emails...");

      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const twentyOneDaysAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);

      const { data: inactiveUsers } = await supabase
        .from("profiles")
        .select("user_id, last_study_date")
        .lt("last_study_date", fourteenDaysAgo.toISOString())
        .gt("last_study_date", twentyOneDaysAgo.toISOString());

      if (inactiveUsers && inactiveUsers.length > 0) {
        console.log(`Found ${inactiveUsers.length} inactive users`);

        for (const user of inactiveUsers) {
          if (await wasRecentlySent(supabase, now, user.user_id, "reactivation", 21 * 24)) continue;

          const result = await sendEmail(user.user_id, "reactivation", {});
          results.push({
            action: "reactivation",
            userId: user.user_id,
            status: result.success ? "sent" : result.reason || "failed",
          });
        }
      }
    }

    // ============ 7. ABANDONED CHECKOUT CLEANUP (72hr → abandoned) ============
    if (action === "all" || action === "cleanup") {
      console.log("Processing abandoned checkout cleanup...");

      const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);

      const { data: staleAttempts, error: staleError } = await supabase
        .from("payment_attempts")
        .update({ status: "abandoned" })
        .eq("status", "pending")
        .lt("created_at", seventyTwoHoursAgo.toISOString())
        .select("id");

      if (staleError) {
        console.error("Error cleaning up stale payment attempts:", staleError);
      } else if (staleAttempts && staleAttempts.length > 0) {
        console.log(`Marked ${staleAttempts.length} payment attempts as abandoned`);
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
