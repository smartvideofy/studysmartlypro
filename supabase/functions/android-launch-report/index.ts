import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TEMPLATE = "android_launch_announcement";

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v).replace(/"/g, '""');
  return /[",\n\r]/.test(s) ? `"${s}"` : s;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const PUB_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);


    // Page helper
    async function pageAll<T>(query: (from: number, to: number) => Promise<{ data: T[] | null; error: any }>): Promise<T[]> {
      const out: T[] = []; const size = 1000; let from = 0;
      while (true) {
        const { data, error } = await query(from, from + size - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        out.push(...data);
        if (data.length < size) break;
        from += size;
      }
      return out;
    }

    const logs = await pageAll<any>((f, t) =>
      admin.from("email_logs")
        .select("user_id, recipient_email, status, resend_id, sent_at, metadata")
        .eq("template_name", TEMPLATE)
        .order("sent_at", { ascending: true })
        .range(f, t)
    );
    const profiles = await pageAll<any>((f, t) =>
      admin.from("profiles").select("user_id, full_name").range(f, t)
    );
    const optedOut = await pageAll<any>((f, t) =>
      admin.from("email_preferences").select("user_id").eq("product_updates", false).range(f, t)
    );

    const nameById: Record<string, string> = {};
    for (const p of profiles) nameById[p.user_id] = p.full_name ?? "";
    const sentIds = new Set(logs.map((l) => l.user_id));
    const optedIds = new Set(optedOut.map((o) => o.user_id));
    const notSent = profiles.filter((p) => !sentIds.has(p.user_id) && !optedIds.has(p.user_id));

    const header = ["recipient_email", "full_name", "user_id", "status", "resend_id", "sent_at", "error", "notes"];
    const rows: string[][] = [header];
    for (const l of logs) {
      rows.push([l.recipient_email ?? "", nameById[l.user_id] ?? "", l.user_id, l.status ?? "sent", l.resend_id ?? "", l.sent_at ?? "", "", "delivered to Resend"]);
    }
    for (const uid of optedIds) {
      rows.push(["", nameById[uid] ?? "", uid, "skipped", "", "", "", "opted out of product_updates"]);
    }
    for (const p of notSent) {
      rows.push(["", p.full_name ?? "", p.user_id, "not_sent", "", "", "", "no log entry"]);
    }

    const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
    const summary = { sent: logs.length, opted_out: optedIds.size, not_sent: notSent.length, total_profiles: profiles.length };

    const url = new URL(req.url);
    if (url.searchParams.get("format") === "json") {
      return new Response(JSON.stringify({ summary, rows: rows.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]]))) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(csv, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="android_launch_delivery_report.csv"`,
        "X-Report-Summary": JSON.stringify(summary),
      },
    });
  } catch (e: any) {
    console.error("android-launch-report error:", e);
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
