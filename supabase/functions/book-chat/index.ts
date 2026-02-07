import { createClient } from "npm:@supabase/supabase-js@2";
import { getSystemPrompt } from "../_shared/blueprint-compiler.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MEM0_API_URL = "https://api.mem0.ai/v1";

const STYLE_INSTRUCTIONS: Record<string, string> = {
  concise: "RESPONSE STYLE: Be concise and direct. Keep responses under 3 sentences when possible. Use bullet points for lists. Avoid preamble or filler.",
  balanced: "RESPONSE STYLE: Provide balanced, well-structured responses with moderate detail. Include context when helpful but stay focused.",
  detailed: "RESPONSE STYLE: Provide comprehensive, detailed responses. Include step-by-step explanations, examples, and nuances.",
  socratic: "RESPONSE STYLE: Use the Socratic method. Ask thought-provoking questions that guide the user to discover insights themselves.",
  storytelling: "RESPONSE STYLE: Use storytelling and narrative techniques. Explain concepts through analogies, metaphors, and real-world examples.",
};

const FORMALITY_INSTRUCTIONS: Record<string, string> = {
  very_casual: "TONE: Very casual, like texting a friend. Use contractions, slang is OK.",
  casual: "TONE: Casual and friendly but clear. Conversational.",
  professional: "TONE: Professional and balanced. Clear and respectful.",
  formal: "TONE: Formal and business-like. Polished language.",
};

const COMPLEXITY_INSTRUCTIONS: Record<string, string> = {
  simple: "COMPLEXITY: Use simple language. Explain like I'm 5. Avoid jargon.",
  moderate: "COMPLEXITY: Use standard language. Some technical terms with brief explanations.",
  advanced: "COMPLEXITY: Technical terms are fine. Assume familiarity with concepts.",
};

const EMOJI_INSTRUCTIONS: Record<string, string> = {
  none: "EMOJI: Do not use any emoji in responses.",
  minimal: "EMOJI: Use emoji very sparingly, only for occasional emphasis.",
  moderate: "EMOJI: Use emoji naturally to add expression and warmth.",
  frequent: "EMOJI: Use emoji frequently to make responses lively and expressive.",
};

interface ProfileResult {
  context: string;
  style: string | null;
  formality: string | null;
  complexity: string | null;
  emoji: string | null;
}

function buildStyleBlock(p: ProfileResult): string {
  const effectiveStyle = p.style || "balanced";
  const parts = [STYLE_INSTRUCTIONS[effectiveStyle] || STYLE_INSTRUCTIONS.balanced];
  if (p.formality && FORMALITY_INSTRUCTIONS[p.formality]) parts.push(FORMALITY_INSTRUCTIONS[p.formality]);
  if (p.complexity && COMPLEXITY_INSTRUCTIONS[p.complexity]) parts.push(COMPLEXITY_INSTRUCTIONS[p.complexity]);
  if (p.emoji && EMOJI_INSTRUCTIONS[p.emoji]) parts.push(EMOJI_INSTRUCTIONS[p.emoji]);
  return parts.join("\n");
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

async function fetchUserProfile(userId: string, supabase: any): Promise<ProfileResult> {
  try {
    const { data } = await supabase
      .from("user_profiles")
      .select("display_name, goals, challenges, interests, career_stage, industry, preferred_response_style, formality_level, language_complexity, emoji_usage")
      .eq("user_id", userId)
      .maybeSingle();
    if (!data) return { context: "", style: null, formality: null, complexity: null, emoji: null };
    const parts: string[] = [];
    if (data.display_name) parts.push(`Name: ${data.display_name}`);
    if (data.career_stage) parts.push(`Career stage: ${data.career_stage}`);
    if (data.industry) parts.push(`Industry: ${data.industry}`);
    if (data.goals?.length) parts.push(`Goals: ${data.goals.join(", ")}`);
    if (data.challenges?.length) parts.push(`Challenges: ${data.challenges.join(", ")}`);
    if (data.interests?.length) parts.push(`Interests: ${data.interests.join(", ")}`);
    return {
      context: parts.length > 0 ? parts.join("\n") : "",
      style: data.preferred_response_style,
      formality: data.formality_level,
      complexity: data.language_complexity,
      emoji: data.emoji_usage,
    };
  } catch { return { context: "", style: null, formality: null, complexity: null, emoji: null }; }
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

    // Use cognitive blueprint if available, otherwise fall back to flat system_prompt
    let systemPrompt = getSystemPrompt(
      book.system_prompt,
      book.cognitive_blueprint,
      book.title,
      "book"
    );

    const MEM0_API_KEY = Deno.env.get("MEM0_API_KEY");
    const lastUserMsg = messages[messages.length - 1]?.content || "";
    let profileResult: ProfileResult = { context: "", style: null, formality: null, complexity: null, emoji: null };

    if (userId) {
      const profilePromise = fetchUserProfile(userId, supabase);
      if (MEM0_API_KEY) {
        const [memoryContext, pr] = await Promise.all([
          fetchMemoryContext(userId, lastUserMsg, MEM0_API_KEY),
          profilePromise,
        ]);
        profileResult = pr;
        if (pr.context || memoryContext) {
          systemPrompt += "\n\n## CONTEXT ABOUT THE READER:";
          if (pr.context) systemPrompt += `\n\n### Reader Profile:\n${pr.context}`;
          if (memoryContext) systemPrompt += `\n\n### Relevant Memories:\n${memoryContext}`;
          systemPrompt += "\n\nUse this context to make the book's concepts more relevant.";
        }
      } else {
        profileResult = await profilePromise;
      }
    }

    systemPrompt += `\n\n${buildStyleBlock(profileResult)}`;

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

    console.log("Book chat - book:", bookId, "userId:", userId || "anonymous", "blueprint:", !!book.cognitive_blueprint);

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
