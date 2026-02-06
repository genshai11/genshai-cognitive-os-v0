import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MEM0_API_URL = "https://api.mem0.ai/v1";

async function fetchMemoryContext(userId: string, query: string, mem0Key: string): Promise<string> {
  try {
    const response = await fetch(`${MEM0_API_URL}/memories/search/`, {
      method: "POST",
      headers: { "Authorization": `Token ${mem0Key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query, user_id: userId, limit: 10 }),
    });
    if (!response.ok) return "";
    const data = await response.json();
    const memories = data.results || data || [];
    if (memories.length === 0) return "";
    return memories.map((m: any) => `- ${m.memory}`).join("\n");
  } catch (e) {
    console.error("Memory fetch error:", e);
    return "";
  }
}

async function fetchUserProfile(userId: string, supabase: any): Promise<string> {
  try {
    const { data } = await supabase
      .from("user_profiles")
      .select("display_name, goals, challenges, interests, career_stage, industry")
      .eq("user_id", userId)
      .maybeSingle();
    if (!data) return "";
    const parts: string[] = [];
    if (data.display_name) parts.push(`Name: ${data.display_name}`);
    if (data.career_stage) parts.push(`Career stage: ${data.career_stage}`);
    if (data.industry) parts.push(`Industry: ${data.industry}`);
    if (data.goals?.length) parts.push(`Goals: ${data.goals.join(", ")}`);
    if (data.challenges?.length) parts.push(`Challenges: ${data.challenges.join(", ")}`);
    if (data.interests?.length) parts.push(`Interests: ${data.interests.join(", ")}`);
    return parts.length > 0 ? parts.join("\n") : "";
  } catch { return ""; }
}

async function addMemories(userId: string, messages: any[], advisorId: string, advisorType: string, mem0Key: string) {
  try {
    await fetch(`${MEM0_API_URL}/memories/`, {
      method: "POST",
      headers: { "Authorization": `Token ${mem0Key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: messages.slice(-4),
        user_id: userId,
        metadata: { advisor_id: advisorId, advisor_type: advisorType },
      }),
    });
  } catch (e) {
    console.error("Memory add error:", e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, personaId, additionalContext, userId } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: persona, error: fetchError } = await supabase
      .from("custom_personas")
      .select("system_prompt, wiki_url, name")
      .eq("id", personaId)
      .single();

    if (fetchError || !persona) {
      console.error("Persona not found:", personaId, fetchError);
      return new Response(
        JSON.stringify({ error: `Persona not found: ${personaId}` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let systemPrompt = persona.system_prompt;
    
    // Add web context if provided
    if (additionalContext) {
      systemPrompt += `\n\n## Reference Information About You:\n${additionalContext}\n\nUse this information to ground your responses in real facts about your life, but always speak as yourself in first person.`;
    }

    const MEM0_API_KEY = Deno.env.get("MEM0_API_KEY");
    const lastUserMsg = messages[messages.length - 1]?.content || "";

    // Inject memory context
    if (userId && MEM0_API_KEY) {
      const [memoryContext, profileContext] = await Promise.all([
        fetchMemoryContext(userId, lastUserMsg, MEM0_API_KEY),
        fetchUserProfile(userId, supabase),
      ]);

      if (profileContext || memoryContext) {
        systemPrompt += "\n\n## CONTEXT ABOUT THE PERSON YOU'RE SPEAKING WITH (use this to personalize your advice):";
        if (profileContext) systemPrompt += `\n\n### Their Profile:\n${profileContext}`;
        if (memoryContext) systemPrompt += `\n\n### Relevant Memories from Past Conversations:\n${memoryContext}`;
        systemPrompt += "\n\nUse this context naturally in your role as this persona. Reference their goals, challenges, or past discussions when relevant. Don't explicitly say 'I remember' unless it flows naturally.";
      }
    }

    console.log("Persona chat - persona:", personaId, "context length:", additionalContext?.length || 0, "userId:", userId || "anonymous");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
        max_tokens: 8192,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limits exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Save memories in background
    if (userId && MEM0_API_KEY && messages.length >= 2) {
      addMemories(userId, messages, personaId, "persona", MEM0_API_KEY);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Persona chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
