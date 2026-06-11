import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAY_URL = "https://play.google.com/store/apps/details?id=com.studily.app";
const TEMPLATE_NAME = "android_launch_announcement";
const SUBJECT = "The Studily Android app is almost here 🚀";

function renderHtml(name: string, unsubscribeUrl: string): string {
  const greeting = name ? `Hi ${name},` : "Hello,";
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f7f7f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;background:#ffffff;">
    <h1 style="font-size:22px;font-weight:700;margin:0 0 16px;color:#1a1a1a;">The Studily Android app is almost here 🚀</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">${greeting}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">We've got something exciting to share. Thousands of students have already used Studily to turn notes, textbooks, articles, and learning materials into flashcards, quizzes, and study notes in seconds. Now we're taking that experience everywhere you go.</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">Soon, you'll be able to access your study materials, generate flashcards, create quizzes, and learn on the go directly from your Android device.</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 8px;font-weight:600;">Why we're excited:</p>
    <ul style="font-size:15px;line-height:1.7;margin:0 0 20px;padding-left:20px;">
      <li>Study anywhere, anytime</li>
      <li>Generate flashcards from your learning materials instantly</li>
      <li>Create quizzes to test your understanding</li>
      <li>Keep your learning organized across devices</li>
      <li>Faster, smoother mobile experience built specifically for students</li>
    </ul>
    <p style="font-size:15px;line-height:1.6;margin:0 0 24px;">This is one of our biggest milestones yet, and as a member of the Studily community, you're getting early access to the news before the public launch. We'd love your support as we bring Studily to Google Play.</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${PLAY_URL}" style="display:inline-block;background:#EC4899;color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;padding:14px 28px;border-radius:10px;">View on Google Play</a>
    </div>
    <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">Or <a href="${PLAY_URL}" style="color:#EC4899;font-weight:600;text-decoration:underline;">check out the Android app on Google Play</a>.</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">Whether you're preparing for exams, reviewing class materials, or trying to learn more efficiently, the Android app is designed to help you study smarter — not longer.</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 24px;">The future of Studily is mobile, and this is just the beginning. Thank you for being part of our journey.</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 4px;">See you on Android,</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 32px;font-weight:600;">The Studily Team</p>
    <hr style="border:none;border-top:1px solid #ececec;margin:24px 0;" />
    <p style="font-size:12px;color:#888;line-height:1.5;margin:0;">You're receiving this because you have a Studily account. <a href="${unsubscribeUrl}" style="color:#888;text-decoration:underline;">Unsubscribe</a>.</p>
  </div>
</body></html>`;
}

function renderText(name: string, unsubscribeUrl: string): string {
  const greeting = name ? `Hi ${name},` : "Hello,";
  return `${greeting}

We've got something exciting to share. The Studily Android app is almost here.

Soon, you'll be able to access your study materials, generate flashcards, create quizzes, and learn on the go directly from your Android device.

Why we're excited:
- Study anywhere, anytime
- Generate flashcards from your learning materials instantly
- Create quizzes to test your understanding
- Keep your learning organized across devices
- Faster, smoother mobile experience built specifically for students

Check out the Android app on Google Play:
${PLAY_URL}

The future of Studily is mobile, and this is just the beginning. Thank you for being part of our journey.

See you on Android,
The Studily Team

---
Unsubscribe: ${unsubscribeUrl}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
    const APP_URL = Deno.env.get("APP_URL") || "https://getstudily.com";

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    // TEMP: auth disabled for targeted re-send. Will be restored after this run.





    const body = await req.json().catch(() => ({}));
    const dryRun: boolean = body.dryRun === true;
    const limit: number | undefined = typeof body.limit === "number" ? body.limit : undefined;

    // Collect all profile user_ids (page through 1000-row limit)
    const userIds: string[] = [];
    let from = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error } = await admin.from("profiles").select("user_id").range(from, from + pageSize - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      for (const r of data) userIds.push(r.user_id);
      if (data.length < pageSize) break;
      from += pageSize;
    }

    const resend = new Resend(RESEND_API_KEY);
    let sent = 0, skipped = 0, failed = 0, alreadySent = 0, optedOut = 0, noEmail = 0;
    const errors: { user_id: string; error: string }[] = [];

    const targetIds = limit ? userIds.slice(0, limit) : userIds;

    let previewHtml: string | null = null;

    for (let i = 0; i < targetIds.length; i++) {
      const userId = targetIds[i];
      try {
        // Already sent?
        const { data: existingLog } = await admin
          .from("email_logs")
          .select("id")
          .eq("user_id", userId)
          .eq("template_name", TEMPLATE_NAME)
          .limit(1);
        if (existingLog && existingLog.length > 0) {
          alreadySent++; skipped++; continue;
        }

        // Get or create email_preferences
        let { data: prefs } = await admin
          .from("email_preferences")
          .select("product_updates, unsubscribe_token")
          .eq("user_id", userId)
          .maybeSingle();
        if (!prefs) {
          const { data: created } = await admin
            .from("email_preferences")
            .insert({ user_id: userId })
            .select("product_updates, unsubscribe_token")
            .single();
          prefs = created;
        }
        if (!prefs || prefs.product_updates === false) {
          optedOut++; skipped++; continue;
        }

        // Get email + name
        const { data: userRes, error: uErr } = await admin.auth.admin.getUserById(userId);
        if (uErr || !userRes?.user?.email) { noEmail++; skipped++; continue; }
        const email = userRes.user.email;

        const { data: profile } = await admin.from("profiles").select("full_name").eq("user_id", userId).maybeSingle();
        const name = (profile?.full_name || "").split(" ")[0] || "";

        const unsubscribeUrl = `${APP_URL}/unsubscribe/${prefs.unsubscribe_token}`;
        const html = renderHtml(name, unsubscribeUrl);
        const text = renderText(name, unsubscribeUrl);

        if (dryRun) {
          if (!previewHtml) previewHtml = html;
          sent++; // counted as would-send
          continue;
        }

        const resp = await resend.emails.send({
          from: "Getstudily <noreply@getstudily.com>",
          to: [email],
          subject: SUBJECT,
          html,
          text,
        });

        await admin.from("email_logs").insert({
          user_id: userId,
          email_type: TEMPLATE_NAME,
          template_name: TEMPLATE_NAME,
          subject: SUBJECT,
          recipient_email: email,
          status: "sent",
          resend_id: resp.data?.id ?? null,
          metadata: { broadcast: "android_launch" },
        });
        sent++;

        // Rate limit pacing: ~10/sec
        if (i % 10 === 9) await new Promise((r) => setTimeout(r, 1100));
      } catch (e: any) {
        failed++;
        errors.push({ user_id: userId, error: e?.message ?? String(e) });
      }
    }

    return new Response(
      JSON.stringify({
        dryRun,
        totalProfiles: userIds.length,
        considered: targetIds.length,
        sent,
        skipped,
        alreadySent,
        optedOut,
        noEmail,
        failed,
        errors: errors.slice(0, 10),
        previewHtml: dryRun ? previewHtml : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("broadcast-android-launch error:", e);
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
