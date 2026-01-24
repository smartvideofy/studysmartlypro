import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const now = new Date();
    const in15Minutes = new Date(now.getTime() + 15 * 60 * 1000);
    const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);

    // Find sessions starting in ~15 minutes that haven't had 15min reminder sent
    const { data: sessions15min, error: error15 } = await supabaseClient
      .from("group_study_sessions")
      .select(`
        id,
        title,
        group_id,
        scheduled_at,
        meeting_link,
        study_groups!inner(name)
      `)
      .eq("reminder_sent_15min", false)
      .gte("scheduled_at", now.toISOString())
      .lte("scheduled_at", in15Minutes.toISOString());

    if (error15) throw error15;

    // Find sessions starting in ~1 hour that haven't had 1hr reminder sent
    const { data: sessions1hr, error: error1hr } = await supabaseClient
      .from("group_study_sessions")
      .select(`
        id,
        title,
        group_id,
        scheduled_at,
        meeting_link,
        study_groups!inner(name)
      `)
      .eq("reminder_sent_1hr", false)
      .gte("scheduled_at", in15Minutes.toISOString())
      .lte("scheduled_at", in1Hour.toISOString());

    if (error1hr) throw error1hr;

    let totalSent = 0;

    // Process 15-minute reminders
    for (const session of sessions15min || []) {
      const groupData = session.study_groups as unknown as { name: string } | null;
      const groupName = groupData?.name || "your group";
      
      // Get group members
      const { data: members } = await supabaseClient
        .from("group_members")
        .select("user_id")
        .eq("group_id", session.group_id);

      if (members?.length) {
        const userIds = members.map(m => m.user_id);

        // Send push notification
        await supabaseClient.functions.invoke("send-push-notification", {
          body: {
            userIds,
            title: `📚 Session starting in 15 mins!`,
            body: `"${session.title}" in ${groupName} is about to begin`,
            data: { 
              type: "session_reminder", 
              action: `/groups/${session.group_id}`,
              meeting_link: session.meeting_link
            }
          }
        });

        // Create in-app notifications
        const notifications = userIds.map(userId => ({
          user_id: userId,
          type: "session_reminder",
          title: `Session starting soon`,
          message: `"${session.title}" in ${groupName} starts in 15 minutes`,
          data: { 
            group_id: session.group_id, 
            session_id: session.id,
            action: `/groups/${session.group_id}`
          }
        }));

        await supabaseClient.from("notifications").insert(notifications);
        totalSent += userIds.length;
      }

      // Mark reminder as sent
      await supabaseClient
        .from("group_study_sessions")
        .update({ reminder_sent_15min: true })
        .eq("id", session.id);
    }

    // Process 1-hour reminders
    for (const session of sessions1hr || []) {
      const groupData = session.study_groups as unknown as { name: string } | null;
      const groupName = groupData?.name || "your group";
      
      const { data: members } = await supabaseClient
        .from("group_members")
        .select("user_id")
        .eq("group_id", session.group_id);

      if (members?.length) {
        const userIds = members.map(m => m.user_id);

        await supabaseClient.functions.invoke("send-push-notification", {
          body: {
            userIds,
            title: `⏰ Study session in 1 hour`,
            body: `"${session.title}" in ${groupName} - get ready!`,
            data: { 
              type: "session_reminder", 
              action: `/groups/${session.group_id}` 
            }
          }
        });

        const notifications = userIds.map(userId => ({
          user_id: userId,
          type: "session_reminder",
          title: `Session in 1 hour`,
          message: `"${session.title}" in ${groupName} starts in 1 hour`,
          data: { 
            group_id: session.group_id, 
            session_id: session.id,
            action: `/groups/${session.group_id}`
          }
        }));

        await supabaseClient.from("notifications").insert(notifications);
        totalSent += userIds.length;
      }

      await supabaseClient
        .from("group_study_sessions")
        .update({ reminder_sent_1hr: true })
        .eq("id", session.id);
    }

    console.log(`Session reminders: ${sessions15min?.length || 0} 15min, ${sessions1hr?.length || 0} 1hr, ${totalSent} notifications sent`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        reminders_15min: sessions15min?.length || 0,
        reminders_1hr: sessions1hr?.length || 0,
        notifications_sent: totalSent
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error scheduling session reminders:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
