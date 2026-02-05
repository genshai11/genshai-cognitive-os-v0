import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, query } = await req.json();
    
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      console.error("FIRECRAWL_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Firecrawl not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let content = "";

    // If URL provided, scrape it
    if (url) {
      console.log("Scraping URL:", url);
      const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          formats: ["markdown"],
          onlyMainContent: true,
        }),
      });

      const scrapeData = await scrapeResponse.json();
      if (scrapeResponse.ok && scrapeData.success) {
        content = scrapeData.data?.markdown || scrapeData.markdown || "";
        console.log("Scraped content length:", content.length);
      } else {
        console.error("Scrape failed:", scrapeData);
      }
    }

    // If query provided, search for additional context
    if (query) {
      console.log("Searching for:", query);
      const searchResponse = await fetch("https://api.firecrawl.dev/v1/search", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          limit: 3,
        }),
      });

      const searchData = await searchResponse.json();
      if (searchResponse.ok && searchData.success && searchData.data) {
        const searchResults = searchData.data
          .map((r: any) => `**${r.title}**\n${r.description || ""}`)
          .join("\n\n");
        content += "\n\n## Additional Context:\n" + searchResults;
        console.log("Added search results");
      }
    }

    // Truncate if too long (keep first 8000 chars for context window)
    if (content.length > 8000) {
      content = content.substring(0, 8000) + "\n\n[Content truncated...]";
    }

    return new Response(
      JSON.stringify({ success: true, content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Fetch persona context error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
