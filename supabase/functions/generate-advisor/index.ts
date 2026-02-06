import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const generatePromptForType = (type: string, input: Record<string, string>) => {
  switch (type) {
    case "persona":
      return `You are an expert at creating AI persona profiles. Given the name "${input.name}", generate a complete persona profile.

Return a JSON object with these exact fields:
- name: The person's full name
- title: A short professional title/role (e.g., "Visionary Entrepreneur", "Stoic Philosopher") 
- description: 1-2 sentence description of who they are and why they're interesting to learn from
- avatar: A single emoji that best represents them
- color: A Tailwind CSS gradient string (e.g., "from-purple-500 to-indigo-700")
- system_prompt: A detailed system prompt (200-400 words) that makes an AI embody this person. Include their key philosophies, communication style, famous quotes, and how they think. Write in second person ("You ARE [name]...")
- response_style: One of: "concise", "balanced", "detailed", "socratic", "storytelling"
- tags: Array of 3-5 relevant topic tags
- wiki_url: Their Wikipedia URL if they're a known figure, or empty string
- source_type: "persona"

Be accurate to the real person's philosophy and communication style.`;

    case "book":
      return `You are an expert at creating AI book advisor profiles. Given the book "${input.title}"${input.author ? ` by ${input.author}` : ''}, generate a complete book profile.

Return a JSON object with these exact fields:
- title: The book's full title
- author: The author's name
- description: 1-2 sentence description of the book and its core message
- cover_emoji: A single emoji that represents the book's theme
- color: A Tailwind CSS gradient string (e.g., "from-amber-500 to-orange-700")
- system_prompt: A detailed system prompt (200-400 words) that makes an AI embody this book's wisdom. Include the key teachings, core concepts, and how to guide users through the material. The AI should speak as a wise guide who deeply understands this book.
- key_concepts: Array of 5-8 key concepts/teachings from the book
- genres: Array of 2-3 genres (e.g., "Self-Help", "Philosophy", "Psychology", "Business", "Spirituality")
- language: "${input.language || 'en'}"
- wiki_url: The book's Wikipedia or Goodreads URL if known, or empty string

Be accurate to the book's actual content and teachings.`;

    case "framework":
      return `You are an expert at creating mental model/thinking framework profiles. Given the framework "${input.name}", generate a complete framework profile.

Return a JSON object with these exact fields:
- name: The framework's name
- title: A short subtitle explaining what it does (e.g., "Break down to fundamentals")
- description: 1-2 sentence description of this thinking framework
- icon: A single emoji that represents the framework
- color: A Tailwind CSS gradient string (e.g., "from-blue-500 to-cyan-700")
- system_prompt: A detailed system prompt (200-400 words) that makes an AI an expert in this framework. Include the core principles, how to apply it step-by-step, common pitfalls, and when to use it. The AI should guide users to apply this framework to their specific problems.
- mental_models: Array of 4-6 related mental models or sub-concepts within this framework
- example_questions: Array of 3-5 example questions a user might ask when using this framework

Be thorough and accurate about the framework's methodology.`;

    default:
      throw new Error(`Unknown advisor type: ${type}`);
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, input } = await req.json();

    if (!type || !input) {
      return new Response(
        JSON.stringify({ error: "Missing type or input" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const userPrompt = generatePromptForType(type, input);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are a JSON generator. Always respond with valid JSON only, no markdown, no code blocks, no extra text. Just the raw JSON object.",
          },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(JSON.stringify({ error: "No content from AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Clean up response - remove markdown code blocks if present
    let cleanContent = content.trim();
    if (cleanContent.startsWith("```")) {
      cleanContent = cleanContent.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const generated = JSON.parse(cleanContent);

    return new Response(JSON.stringify({ generated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Generate advisor error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
