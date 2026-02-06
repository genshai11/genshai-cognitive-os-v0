import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MEM0_API_URL = "https://api.mem0.ai/v1";

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

    // Inject memory context
    if (userId && MEM0_API_KEY) {
      const [memoryContext, profileContext] = await Promise.all([
        fetchMemoryContext(userId, lastUserMsg, MEM0_API_KEY),
        fetchUserProfile(userId, supabase),
      ]);

      if (profileContext || memoryContext) {
        systemPrompt += "\n\n## CONTEXT ABOUT THE READER (use this to personalize your explanations):";
        if (profileContext) systemPrompt += `\n\n### Reader Profile:\n${profileContext}`;
        if (memoryContext) systemPrompt += `\n\n### Relevant Memories from Past Conversations:\n${memoryContext}`;
        systemPrompt += "\n\nUse this context to make the book's concepts more relevant to the reader's situation. Connect ideas to their goals and challenges when possible.";
      }
    }

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

    // Save memories in background
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
