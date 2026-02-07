import { createClient } from "npm:@supabase/supabase-js@2";
import { getSystemPrompt } from "../_shared/blueprint-compiler.ts";
import { getSkillContext } from "../_shared/skill-discovery.ts";

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

const VISUALIZATION_GUIDE = `

## VISUALIZATION CAPABILITIES

You can create visual diagrams using Mermaid syntax to explain complex concepts:

**Flowcharts** (decision trees, processes):
\`\`\`mermaid
graph TD
    A[Start] --> B{Decision?}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E
\`\`\`

**Sequence Diagrams** (interactions, workflows):
\`\`\`mermaid
sequenceDiagram
    User->>System: Request
    System->>Database: Query
    Database-->>System: Data
    System-->>User: Response
\`\`\`

**Mind Maps** (concept relationships):
\`\`\`mermaid
mindmap
  root((Main Idea))
    Concept 1
      Detail A
      Detail B
    Concept 2
      Detail C
\`\`\`

**Use diagrams when explaining:**
- Complex workflows or decision processes
- System architecture or relationships
- Step-by-step procedures
- Concept hierarchies
- Comparisons or alternatives

Keep diagrams simple and focused. Use clear labels.
`;

const IMAGE_GENERATION_GUIDE = `

## IMAGE GENERATION

You can generate AI images to illustrate concepts visually:

\`\`\`image
{
  "prompt": "A serene Japanese garden with a koi pond, representing mental clarity and peace, minimalist illustration style",
  "caption": "Your mind can be like this garden - organized, peaceful, and beautiful"
}
\`\`\`

**When to use images:**
- Illustrating abstract concepts or metaphors
- Visual scenarios or environments
- Comparisons (before/after, A vs B)
- Emotional states or moods
- Conceptual frameworks

**Prompt guidelines:**
- Be specific and descriptive
- Include artistic style (e.g., "minimalist illustration", "watercolor", "photorealistic")
- Mention mood/atmosphere
- Keep it relevant to the conversation
- Avoid text in images

**Example:**
User: "I feel overwhelmed with tasks"
\`\`\`image
{
  "prompt": "A calm person organizing colorful sticky notes on a wall into clear categories, soft lighting, minimalist illustration style",
  "caption": "Breaking down overwhelming tasks into organized categories"
}
\`\`\`

Use images sparingly - only when they truly enhance understanding.
`;

interface ProfileResult {
  context: string;
  style: string | null;
  formality: string | null;
  complexity: string | null;
  emoji: string | null;
}

function buildStyleBlock(p: ProfileResult, personaStyle?: string | null): string {
  const effectiveStyle = p.style || personaStyle || "balanced";
  const parts = [STYLE_INSTRUCTIONS[effectiveStyle] || STYLE_INSTRUCTIONS.balanced];
  if (p.formality && FORMALITY_INSTRUCTIONS[p.formality]) parts.push(FORMALITY_INSTRUCTIONS[p.formality]);
  if (p.complexity && COMPLEXITY_INSTRUCTIONS[p.complexity]) parts.push(COMPLEXITY_INSTRUCTIONS[p.complexity]);
  if (p.emoji && EMOJI_INSTRUCTIONS[p.emoji]) parts.push(EMOJI_INSTRUCTIONS[p.emoji]);
  return parts.join("\n");
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
    const { messages, personaId, additionalContext, userId } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: persona, error: fetchError } = await supabase
      .from("custom_personas")
      .select("system_prompt, wiki_url, name, response_style")
      .eq("id", personaId)
      .single();

    if (fetchError || !persona) {
      console.error("Persona not found:", personaId, fetchError);
      return new Response(
        JSON.stringify({ error: `Persona not found: ${personaId}` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use cognitive blueprint if available, otherwise fall back to flat system_prompt
    let systemPrompt = getSystemPrompt(
      persona.system_prompt,
      null,
      persona.name,
      "persona"
    );

    if (additionalContext) {
      systemPrompt += `\n\n## Reference Information About You:\n${additionalContext}\n\nUse this information to ground your responses in real facts about your life, but always speak as yourself in first person.`;
    }

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
          systemPrompt += "\n\n## CONTEXT ABOUT THE PERSON YOU'RE SPEAKING WITH:";
          if (pr.context) systemPrompt += `\n\n### Their Profile:\n${pr.context}`;
          if (memoryContext) systemPrompt += `\n\n### Relevant Memories from Past Conversations:\n${memoryContext}`;
          systemPrompt += "\n\nUse this context naturally in your role as this persona.";
        }
      } else {
        profileResult = await profilePromise;
      }
    }

    // Inject skill context if user is authenticated
    if (userId) {
      const skillContext = await getSkillContext(supabase, userId, personaId);
      if (skillContext) {
        systemPrompt += `\n\n${skillContext}`;
      }
    }

    // Add style, visualization, and image generation guides
    systemPrompt += `\n\n${buildStyleBlock(profileResult, persona.response_style)}`;
    systemPrompt += VISUALIZATION_GUIDE;
    systemPrompt += IMAGE_GENERATION_GUIDE;

    console.log("Persona chat - persona:", personaId, "userId:", userId || "anonymous");

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
