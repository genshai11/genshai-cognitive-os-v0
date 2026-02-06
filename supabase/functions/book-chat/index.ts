import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MEM0_API_URL = "https://api.mem0.ai/v1";

const STYLE_INSTRUCTIONS: Record<string, string> = {
  concise: "RESPONSE STYLE: Be concise and direct. Keep responses under 3 sentences when possible. Use bullet points for lists. Avoid preamble or filler. Get straight to the actionable insight.",
  balanced: "RESPONSE STYLE: Provide balanced, well-structured responses with moderate detail. Include context when helpful but stay focused. Use headers or bullet points for clarity.",
  detailed: "RESPONSE STYLE: Provide comprehensive, detailed responses. Include step-by-step explanations, examples, and nuances. Cover edge cases and provide thorough analysis.",
  socratic: "RESPONSE STYLE: Use the Socratic method. Instead of giving direct answers, ask thought-provoking questions that guide the user to discover insights themselves. Challenge assumptions gently.",
  storytelling: "RESPONSE STYLE: Use storytelling and narrative techniques. Explain concepts through analogies, metaphors, and real-world examples. Paint vivid scenarios. Make abstract ideas concrete through stories.",
};

function getStyleInstruction(style: string | null | undefined): string {
  return STYLE_INSTRUCTIONS[style || "balanced"] || STYLE_INSTRUCTIONS.balanced;
}

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

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

async function fetchUserProfile(userId: string, supabase: any): Promise<{ context: string; style: string | null }> {
  try {
    const { data } = await supabase
      .from("user_profiles")
      .select("display_name, goals, challenges, interests, career_stage, industry, preferred_response_style")
      .eq("user_id", userId)
      .maybeSingle();
    if (!data) return { context: "", style: null };
    const parts: string[] = [];
    if (data.display_name) parts.push(`Name: ${data.display_name}`);
    if (data.career_stage) parts.push(`Career stage: ${data.career_stage}`);
    if (data.industry) parts.push(`Industry: ${data.industry}`);
    if (data.goals?.length) parts.push(`Goals: ${data.goals.join(", ")}`);
    if (data.challenges?.length) parts.push(`Challenges: ${data.challenges.join(", ")}`);
    if (data.interests?.length) parts.push(`Interests: ${data.interests.join(", ")}`);
    return { context: parts.length > 0 ? parts.join("\n") : "", style: data.preferred_response_style };
  } catch { return { context: "", style: null }; }
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
    const { messages, bookId, userId } = await req.json();

    if (!messages || !bookId) {
      return new Response(
        JSON.stringify({ error: "Missing messages or bookId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: book, error: bookError } = await supabase
      .from("custom_books")
      .select("*")
      .eq("id", bookId)
      .single();

    if (bookError || !book) {
      return new Response(
        JSON.stringify({ error: "Book not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let systemPrompt = book.system_prompt;
    const MEM0_API_KEY = Deno.env.get("MEM0_API_KEY");
    const lastUserMsg = messages[messages.length - 1]?.content || "";
    let userStyle: string | null = null;

    if (userId && MEM0_API_KEY) {
      const [memoryContext, profileResult] = await Promise.all([
        fetchMemoryContext(userId, lastUserMsg, MEM0_API_KEY),
        fetchUserProfile(userId, supabase),
      ]);
      userStyle = profileResult.style;

      if (profileResult.context || memoryContext) {
        systemPrompt += "\n\n## CONTEXT ABOUT THE READER (use this to personalize your explanations):";
        if (profileResult.context) systemPrompt += `\n\n### Reader Profile:\n${profileResult.context}`;
        if (memoryContext) systemPrompt += `\n\n### Relevant Memories from Past Conversations:\n${memoryContext}`;
        systemPrompt += "\n\nUse this context to make the book's concepts more relevant to the reader's situation.";
      }
    } else if (userId) {
      const profile = await fetchUserProfile(userId, supabase);
      userStyle = profile.style;
    }

    // Inject response style
    systemPrompt += `\n\n${getStyleInstruction(userStyle)}`;

    const apiMessages: Message[] = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: apiMessages,
        stream: true,
        max_tokens: 8192,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to get AI response" }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (userId && MEM0_API_KEY && messages.length >= 2) {
      addMemories(userId, messages, bookId, "book", MEM0_API_KEY);
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
