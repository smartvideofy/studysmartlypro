import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-run-secret",
};

const BUCKET = "study-materials";
const LARGE_FILE_THRESHOLD = 15 * 1024 * 1024;

type Material = {
  id: string;
  file_path: string | null;
  processing_status: string | null;
  file_size: number | null;
};

async function listAll(
  supabase: ReturnType<typeof createClient>,
  bucket: string,
  prefix: string,
): Promise<string[]> {
  const out: string[] = [];
  let offset = 0;
  const limit = 1000;
  while (true) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(prefix, { limit, offset });
    if (error) throw new Error(`list ${bucket}/${prefix}: ${error.message}`);
    if (!data || data.length === 0) break;
    for (const entry of data) {
      const full = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id === null) {
        // folder placeholder -> recurse
        out.push(...(await listAll(supabase, bucket, full)));
      } else {
        out.push(full);
      }
    }
    if (data.length < limit) break;
    offset += limit;
  }
  return out;
}

async function removeInBatches(
  supabase: ReturnType<typeof createClient>,
  bucket: string,
  paths: string[],
  dryRun: boolean,
): Promise<{ removed: number; errors: string[] }> {
  const errors: string[] = [];
  let removed = 0;
  if (dryRun) return { removed: paths.length, errors };
  for (let i = 0; i < paths.length; i += 100) {
    const batch = paths.slice(i, i + 100);
    const { error } = await supabase.storage.from(bucket).remove(batch);
    if (error) errors.push(error.message);
    else removed += batch.length;
  }
  return { removed, errors };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const runSecret = Deno.env.get("STORAGE_CLEANUP_SECRET");
    const provided = req.headers.get("x-run-secret");
    if (!runSecret || provided !== runSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dryRun !== false;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // --- Load all study materials (paged) ---
    const materials: Material[] = [];
    let from = 0;
    const page = 1000;
    while (true) {
      const { data, error } = await supabase
        .from("study_materials")
        .select("id, file_path, processing_status, file_size")
        .range(from, from + page - 1);
      if (error) throw new Error(`materials: ${error.message}`);
      if (!data || data.length === 0) break;
      materials.push(...(data as Material[]));
      if (data.length < page) break;
      from += page;
    }

    const byPath = new Map<string, Material>();
    for (const m of materials) if (m.file_path) byPath.set(m.file_path, m);

    // --- Classify study-materials objects ---
    const allObjects = await listAll(supabase, BUCKET, "");
    const orphans: string[] = [];
    const failedFiles: string[] = [];
    const largeCompleted: string[] = [];

    for (const name of allObjects) {
      const m = byPath.get(name);
      if (!m) {
        orphans.push(name);
      } else if (m.processing_status === "failed") {
        failedFiles.push(name);
      } else if (
        m.processing_status === "completed" &&
        (m.file_size ?? 0) > LARGE_FILE_THRESHOLD
      ) {
        largeCompleted.push(name);
      }
    }

    // --- Unused marketing assets ---
    const marketing = await listAll(supabase, "marketing-assets", "");
    const marketingJunk = marketing.filter(
      (n) => n.startsWith("carousels/") || n.startsWith("generated/"),
    );

    const results: Record<string, unknown> = {
      dryRun,
      counts: {
        totalObjects: allObjects.length,
        orphans: orphans.length,
        failedFiles: failedFiles.length,
        largeCompleted: largeCompleted.length,
        marketingJunk: marketingJunk.length,
      },
    };

    const toRemove = [...orphans, ...failedFiles, ...largeCompleted];
    const r1 = await removeInBatches(supabase, BUCKET, toRemove, dryRun);
    const r2 = await removeInBatches(
      supabase,
      "marketing-assets",
      marketingJunk,
      dryRun,
    );

    results.studyMaterials = r1;
    results.marketingAssets = r2;

    // --- Null out file_path for rows whose binary is gone ---
    if (!dryRun) {
      const clearedIds = [...failedFiles, ...largeCompleted]
        .map((p) => byPath.get(p)?.id)
        .filter(Boolean) as string[];
      let cleared = 0;
      for (let i = 0; i < clearedIds.length; i += 100) {
        const batch = clearedIds.slice(i, i + 100);
        const { error } = await supabase
          .from("study_materials")
          .update({ file_path: null })
          .in("id", batch);
        if (!error) cleared += batch.length;
      }
      results.rowsCleared = cleared;
    }

    return new Response(JSON.stringify(results, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
