import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { MIGRATIONS } from "./migrations.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-run-secret",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const secret = Deno.env.get("STORAGE_CLEANUP_SECRET");
  if (!secret || req.headers.get("x-run-secret") !== secret) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const body = await req.json().catch(() => ({}));
  const startIndex: number = body.startIndex ?? 0;
  const count: number = body.count ?? MIGRATIONS.length;

  const client = new Client(Deno.env.get("SUPABASE_DB_URL")!);
  await client.connect();

  const results: { name: string; ok: boolean; error?: string }[] = [];
  try {
    await client.queryArray(`create table if not exists public._applied_migrations (
      name text primary key, applied_at timestamptz not null default now())`);

    const slice = MIGRATIONS.slice(startIndex, startIndex + count);
    for (const m of slice) {
      const done = await client.queryArray(
        "select 1 from public._applied_migrations where name = $1",
        [m.name],
      );
      if (done.rows.length > 0) {
        results.push({ name: m.name, ok: true, error: "already applied" });
        continue;
      }
      try {
        await client.queryArray("begin");
        await client.queryArray(m.sql);
        await client.queryArray("insert into public._applied_migrations(name) values ($1)", [m.name]);
        await client.queryArray("commit");
        results.push({ name: m.name, ok: true });
      } catch (e) {
        await client.queryArray("rollback").catch(() => {});
        results.push({ name: m.name, ok: false, error: String(e) });
        break;
      }
    }
  } finally {
    await client.end();
  }

  return new Response(JSON.stringify({ total: MIGRATIONS.length, results }, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
