import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cliproxy_url } = await req.json();

    if (!cliproxy_url) {
      return new Response(
        JSON.stringify({ success: false, error: "cliproxy_url is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return new Response(
          JSON.stringify({ success: false, error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Test connection to CLIProxyAPI
    const testUrl = `${cliproxy_url.replace(/\/$/, '')}/v1/models`;
    console.log("Testing CLIProxyAPI connection:", testUrl);

    const response = await fetch(testUrl, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ success: false, error: `Server returned ${response.status}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const models = (data.data || data || []).map((m: any) => m.id || m.name || m).filter(Boolean);

    console.log("CLIProxyAPI available models:", models.length);

    return new Response(
      JSON.stringify({ success: true, models }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Test connection error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Connection failed",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
