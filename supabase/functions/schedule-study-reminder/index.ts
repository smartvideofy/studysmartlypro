import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Study reminder messages
const reminderMessages = [
  { title: "📚 Time to Study!", body: "Your brain is ready for some learning. Let's go!" },
  { title: "🎯 Study Session Awaits", body: "Small steps lead to big knowledge. Start now!" },
  { title: "💪 Knowledge is Power", body: "Take 15 minutes to review your flashcards." },
  { title: "🧠 Brain Boost Time", body: "Your future self will thank you for studying today." },
  { title: "⏰ Study Reminder", body: "Consistency is key! Time for your daily study session." },
  { title: "🌟 You've Got This!", body: "Even 10 minutes of study makes a difference." },
  { title: "📖 Learning Time", body: "Open your notes and let's make progress!" },
  { title: "🚀 Level Up Today", body: "Every study session brings you closer to your goals." }
];

function getRandomReminder() {
  return reminderMessages[Math.floor(Math.random() * reminderMessages.length)];
}

function getTimeOfDayHour(preferredTime: string): number {
  switch (preferredTime) {
    case 'morning': return 9;
    case 'afternoon': return 14;
    case 'evening': return 18;
    case 'night': return 21;
    default: return 10;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth guard: only allow service role
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.includes(serviceRoleKey)) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      serviceRoleKey
    );

    // Get all users who have notifications enabled and have push subscriptions
    const { data: profiles, error: profilesError } = await supabaseClient
      .from("profiles")
      .select("user_id, preferred_study_time, full_name")
      .eq("notification_enabled", true);

    if (profilesError) throw profilesError;

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No users with notifications enabled" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check which users have push subscriptions
    const { data: subscriptions, error: subsError } = await supabaseClient
      .from("push_subscriptions")
      .select("user_id")
      .in("user_id", profiles.map(p => p.user_id));

    if (subsError) throw subsError;

    const usersWithSubs = new Set(subscriptions?.map(s => s.user_id) || []);
    
    // Filter to users who have subscriptions and should receive reminder now
    const currentHour = new Date().getUTCHours();
    const eligibleUsers = profiles.filter(p => {
      if (!usersWithSubs.has(p.user_id)) return false;
      
      // Check if current hour matches their preferred time (with some tolerance)
      const preferredHour = getTimeOfDayHour(p.preferred_study_time || 'morning');
      return Math.abs(currentHour - preferredHour) <= 1;
    });

    if (eligibleUsers.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No users eligible for reminders at this time" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send reminders
    const reminder = getRandomReminder();
    const userIds = eligibleUsers.map(u => u.user_id);

    // Call the send-push-notification function
    const { error: sendError } = await supabaseClient.functions.invoke("send-push-notification", {
      body: {
        userIds,
        title: reminder.title,
        body: reminder.body,
        data: { type: "study_reminder", action: "/dashboard" }
      }
    });

    if (sendError) throw sendError;

    // Also create in-app notifications
    const notifications = eligibleUsers.map(u => ({
      user_id: u.user_id,
      type: "study_reminder",
      title: reminder.title,
      message: reminder.body,
      data: { action: "/dashboard" }
    }));

    await supabaseClient.from("notifications").insert(notifications);

    console.log(`Study reminders sent to ${eligibleUsers.length} users`);

    return new Response(
      JSON.stringify({ success: true, sent: eligibleUsers.length }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error scheduling study reminders:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
