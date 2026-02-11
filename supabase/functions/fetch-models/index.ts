const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { endpoint, apiKey } = await req.json();

    if (!endpoint || !apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing endpoint or apiKey" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize endpoint: strip trailing /v1 or /v1/ if present, then add /v1/models
    const base = endpoint.replace(/\/v1\/?$/, "");
    const modelsUrl = `${base}/v1/models`;

    const response = await fetch(modelsUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Models endpoint error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `Failed to fetch models: ${response.status}`, models: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const rawModels = data.data || data.models || [];

    // Normalize model objects
    const models = rawModels.map((m: any) => ({
      id: m.id || m.model || "",
      name: m.name || m.id || "",
      owned_by: m.owned_by || "",
      provider: m.owned_by || (m.id?.includes("/") ? m.id.split("/")[0] : "unknown"),
    }));

    // Extract unique providers
    const providers = [...new Set(models.map((m: any) => m.provider))].filter(Boolean).sort();

    return new Response(
      JSON.stringify({ models, providers }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("fetch-models error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal error", models: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
