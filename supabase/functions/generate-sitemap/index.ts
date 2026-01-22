import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://studysmartlypro.lovable.app";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all active help categories
    const { data: categories, error: catError } = await supabase
      .from("help_categories")
      .select("slug, updated_at")
      .eq("is_active", true)
      .order("display_order");

    if (catError) throw catError;

    // Fetch all active help articles
    const { data: articles, error: artError } = await supabase
      .from("help_articles")
      .select("slug, updated_at")
      .eq("is_active", true)
      .order("updated_at", { ascending: false });

    if (artError) throw artError;

    // Generate sitemap XML
    const now = new Date().toISOString();
    
    const staticPages = [
      { url: "/", priority: "1.0", changefreq: "weekly" },
      { url: "/help", priority: "0.9", changefreq: "daily" },
      { url: "/pricing", priority: "0.8", changefreq: "monthly" },
      { url: "/auth", priority: "0.5", changefreq: "monthly" },
    ];

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Static pages
    for (const page of staticPages) {
      sitemap += `  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    }

    // Help categories
    for (const category of categories || []) {
      sitemap += `  <url>
    <loc>${SITE_URL}/help/category/${category.slug}</loc>
    <lastmod>${category.updated_at || now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
    }

    // Help articles
    for (const article of articles || []) {
      sitemap += `  <url>
    <loc>${SITE_URL}/help/article/${article.slug}</loc>
    <lastmod>${article.updated_at || now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
    }

    sitemap += `</urlset>`;

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Sitemap generation error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
