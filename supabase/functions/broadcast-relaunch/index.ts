import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAY_URL = "https://play.google.com/store/apps/details?id=com.studily.app";
const IOS_URL = "https://testflight.apple.com/join/2CHgmH96";
const CAMPAIGN = "relaunch_2026";
const SUBJECT = "Remember Studily? We're back — with 7 days of Pro for you";
const PINK = "#EC4899";

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
}

function renderHtml(name: string, unsubscribeUrl: string): string {
  const greeting = name ? `Hi ${esc(name)},` : "Hi there,";
  const p = "font-size:15px;line-height:1.65;margin:0 0 16px;color:#1a1a1a;";
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f7f7f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:580px;margin:0 auto;padding:32px 24px;background:#ffffff;">
    <p style="${p}">${greeting}</p>
    <h1 style="font-size:22px;font-weight:700;margin:0 0 16px;color:#1a1a1a;">Remember Studily?</h1>
    <p style="${p}">We've been rebuilding it, and we're excited to have you back.</p>
    <p style="${p}">Studily is now available on <a href="${PLAY_URL}" style="color:${PINK};font-weight:600;text-decoration:underline;">Android</a> and <a href="${IOS_URL}" style="color:${PINK};font-weight:600;text-decoration:underline;">iPhone</a>, with a faster AI-powered study experience for turning your course materials into useful study resources.</p>

    <h2 style="font-size:17px;font-weight:700;margin:28px 0 12px;color:#1a1a1a;">What's new</h2>

    <p style="${p}"><strong>📚 Turn your materials into study tools</strong><br/>Upload PDFs, slides, notes, documents, and other study materials and turn them into summaries, flashcards, quizzes, and more.</p>
    <p style="${p}"><strong>🤖 Faster AI-powered studying</strong><br/>Studily's AI has been upgraded to make generating study materials and getting help from your AI tutor faster and more reliable.</p>
    <p style="${p}"><strong>📅 Stay on top of exams</strong><br/>Use exam countdowns and study planning tools to keep your important dates in view.</p>

    <h2 style="font-size:17px;font-weight:700;margin:28px 0 12px;color:#1a1a1a;">🎁 Welcome back: 7 days of Pro</h2>
    <p style="${p}">Because you've used Studily before, we'd love to give you another reason to come back.</p>
    <p style="${p}">Start a 7-day free Pro trial through the Studily mobile app.</p>

    <div style="text-align:center;margin:28px 0;">
      <a href="${PLAY_URL}" style="display:inline-block;background:${PINK};color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;padding:14px 28px;border-radius:10px;">Download Studily on Android</a>
    </div>

    <p style="${p}">If you're using an iPhone, you can <a href="${IOS_URL}" style="color:${PINK};font-weight:600;text-decoration:underline;">download Studily for iPhone</a> and start your trial there too.</p>
    <p style="${p}">Your previous Studily login may need to be reactivated on our new platform. Simply use the email address you previously registered with, or sign up again if needed.</p>
    <p style="${p}">We'd love to have you back.</p>
    <p style="${p}">Happy studying,<br/><strong>The Studily Team</strong></p>
    <p style="${p}">P.S. You don't need to commit to a subscription just to try Studily. Start with your 7-day Pro trial and see what's new.</p>

    <hr style="border:none;border-top:1px solid #ececec;margin:28px 0 16px;" />
    <p style="font-size:12px;color:#888;line-height:1.5;margin:0;">You received this email because you previously created a Studily account. If you no longer want to hear from us, you can <a href="${unsubscribeUrl}" style="color:#888;text-decoration:underline;">unsubscribe</a>.</p>
  </div>
</body></html>`;
}

function renderText(name: string, unsubscribeUrl: string): string {
  const greeting = name ? `Hi ${name},` : "Hi there,";
  return `${greeting}

Remember Studily?

We've been rebuilding it, and we're excited to have you back.

Studily is now available on Android and iPhone, with a faster AI-powered study experience for turning your course materials into useful study resources.

What's new

Turn your materials into study tools
Upload PDFs, slides, notes, documents, and other study materials and turn them into summaries, flashcards, quizzes, and more.

Faster AI-powered studying
Studily's AI has been upgraded to make generating study materials and getting help from your AI tutor faster and more reliable.

Stay on top of exams
Use exam countdowns and study planning tools to keep your important dates in view.

Welcome back: 7 days of Pro

Because you've used Studily before, we'd love to give you another reason to come back.

Start a 7-day free Pro trial through the Studily mobile app.

Download Studily on Android: ${PLAY_URL}
Download Studily for iPhone: ${IOS_URL}

Your previous Studily login may need to be reactivated on our new platform. Simply use the email address you previously registered with, or sign up again if needed.

We'd love to have you back.

Happy studying,
The Studily Team

P.S. You don't need to commit to a subscription just to try Studily. Start with your 7-day Pro trial and see what's new.

---
You received this email because you previously created a Studily account. Unsubscribe: ${unsubscribeUrl}`;
}

function htmlPage(title: string, body: string): Response {
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f7f7f8;">
<div style="max-width:480px;margin:80px auto;background:#fff;padding:40px 28px;border-radius:14px;text-align:center;">
<h1 style="font-size:20px;color:#1a1a1a;margin:0 0 12px;">${title}</h1>
<p style="font-size:15px;color:#555;line-height:1.6;margin:0;">${body}</p>
</div></body></html>`,
    { status: 200, headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } },
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const url = new URL(req.url);

    // ---- Public unsubscribe link (GET) ----
    const token = url.searchParams.get("unsubscribe");
    if (req.method === "GET" && token) {
      const { data, error } = await admin
        .from("legacy_recipients")
        .update({ unsubscribed: true, unsubscribed_at: new Date().toISOString() })
        .eq("unsubscribe_token", token)
        .select("email")
        .maybeSingle();
      if (error || !data) {
        return htmlPage("Link not recognised", "We couldn't find this unsubscribe link. It may have already been used.");
      }
      return htmlPage("You're unsubscribed", `We won't email ${esc(data.email)} again. Sorry to see you go — you're always welcome back at Studily.`);
    }

    // ---- Admin-only actions ----
    const authHeader = req.headers.get("Authorization");
    const PUB_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";
    const allowedKeys = new Set([SERVICE_KEY, ANON_KEY, PUB_KEY].filter(Boolean));
    let authorized = false;
    if (authHeader?.startsWith("Bearer ")) {
      const t = authHeader.replace("Bearer ", "");
      if (allowedKeys.has(t)) {
        authorized = true;
      } else {
        const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
        const { data: userData } = await userClient.auth.getUser(t);
        if (userData?.user?.id) {
          const { data: isAdmin } = await admin.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
          if (isAdmin) authorized = true;
        }
      }
    }
    if (!authorized) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const action = (body.action as string) ?? "send";

    // ---- Import recipients ----
    if (action === "import") {
      const rows = (body.recipients as Array<{ email: string; full_name?: string; legacy_user_id?: string }>) ?? [];
      if (!Array.isArray(rows) || rows.length === 0) {
        return new Response(JSON.stringify({ error: "recipients array required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const clean = rows
        .filter((r) => typeof r.email === "string" && r.email.includes("@"))
        .map((r) => ({
          email: r.email.trim().toLowerCase(),
          full_name: r.full_name?.trim() || null,
          legacy_user_id: r.legacy_user_id || null,
          campaign: CAMPAIGN,
        }));
      const { error } = await admin.from("legacy_recipients").upsert(clean, { onConflict: "email", ignoreDuplicates: true });
      if (error) throw error;
      const { count } = await admin.from("legacy_recipients").select("id", { count: "exact", head: true });
      return new Response(JSON.stringify({ imported: clean.length, totalInTable: count }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Send campaign ----
    const dryRun = body.dryRun === true;
    const limit = typeof body.limit === "number" ? body.limit : undefined;

    const { data: recipients, error: rErr } = await admin
      .from("legacy_recipients")
      .select("id, email, full_name, unsubscribe_token, unsubscribed, status")
      .eq("campaign", CAMPAIGN)
      .eq("unsubscribed", false)
      .neq("status", "sent")
      .order("created_at", { ascending: true })
      .limit(limit ?? 2000);
    if (rErr) throw rErr;

    const resend = new Resend(RESEND_API_KEY);
    let sent = 0, failed = 0;
    const errors: { email: string; error: string }[] = [];
    let previewHtml: string | null = null;

    for (let i = 0; i < (recipients?.length ?? 0); i++) {
      const r = recipients![i];
      const name = (r.full_name || "").split(" ")[0] || "";
      const unsubscribeUrl = `${SUPABASE_URL}/functions/v1/broadcast-relaunch?unsubscribe=${r.unsubscribe_token}`;
      const html = renderHtml(name, unsubscribeUrl);
      const text = renderText(name, unsubscribeUrl);

      if (dryRun) {
        if (!previewHtml) previewHtml = html;
        sent++;
        continue;
      }

      try {
        const resp = await resend.emails.send({
          from: "Studily <noreply@getstudily.com>",
          to: [r.email],
          subject: SUBJECT,
          html,
          text,
        });
        if (resp.error) throw new Error(resp.error.message);
        await admin
          .from("legacy_recipients")
          .update({ status: "sent", resend_id: resp.data?.id ?? null, sent_at: new Date().toISOString(), error: null })
          .eq("id", r.id);
        sent++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        failed++;
        errors.push({ email: r.email, error: msg });
        await admin.from("legacy_recipients").update({ status: "failed", error: msg }).eq("id", r.id);
      }

      if (i % 5 === 4) await new Promise((res) => setTimeout(res, 1100));
    }

    return new Response(
      JSON.stringify({
        dryRun,
        eligible: recipients?.length ?? 0,
        sent,
        failed,
        errors: errors.slice(0, 10),
        previewHtml: dryRun ? previewHtml : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("broadcast-relaunch error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
