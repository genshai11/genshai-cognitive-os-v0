import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STYLE_DEFINITIONS = {
  concise: "Prefers short, direct responses under 3 sentences. Gets straight to the point.",
  balanced: "Prefers moderate detail with clear structure. Default communication style.",
  detailed: "Prefers comprehensive explanations with step-by-step breakdowns.",
  socratic: "Prefers being guided through questions rather than direct answers.",
  storytelling: "Prefers narratives, analogies, metaphors, and real-world examples.",
};

interface DetectionResult {
  detected_style: string;
  confidence: number;
  reasoning: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, messages } = await req.json();

    if (!userId || !messages || messages.length < 5) {
      return new Response(
        JSON.stringify({ error: "Insufficient data for detection", updated: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if user has adaptive detection enabled (A/B test)
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("adaptive_style_enabled, preferred_response_style")
      .eq("user_id", userId)
      .maybeSingle();

    if (!profile?.adaptive_style_enabled) {
      return new Response(
        JSON.stringify({ error: "Adaptive detection not enabled for user", updated: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only analyze user messages
    const userMessages = messages.filter((m: any) => m.role === "user").slice(-20);
    if (userMessages.length < 3) {
      return new Response(
        JSON.stringify({ error: "Not enough user messages", updated: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Build analysis prompt
    const analysisPrompt = `Analyze these user messages to detect their preferred communication style.

USER MESSAGES:
${userMessages.map((m: any, i: number) => `${i + 1}. "${m.content}"`).join("\n")}

AVAILABLE STYLES:
${Object.entries(STYLE_DEFINITIONS).map(([k, v]) => `- ${k}: ${v}`).join("\n")}

ANALYSIS CRITERIA:
- Message length patterns (short = concise, long = detailed)
- Question frequency (many questions = socratic tendency)
- Use of stories/examples (storytelling preference)
- Direct vs exploratory language

Return your analysis using the detect_style function.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an expert at analyzing communication patterns to detect preferred styles." },
          { role: "user", content: analysisPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "detect_style",
              description: "Report the detected communication style preference",
              parameters: {
                type: "object",
                properties: {
                  detected_style: {
                    type: "string",
                    enum: ["concise", "balanced", "detailed", "socratic", "storytelling"],
                    description: "The detected preferred style",
                  },
                  confidence: {
                    type: "number",
                    minimum: 0,
                    maximum: 1,
                    description: "Confidence score from 0 to 1",
                  },
                  reasoning: {
                    type: "string",
                    description: "Brief explanation of why this style was detected",
                  },
                },
                required: ["detected_style", "confidence", "reasoning"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "detect_style" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI detection error:", errorText);
      return new Response(
        JSON.stringify({ error: "Detection failed", updated: false }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response");
      return new Response(
        JSON.stringify({ error: "Invalid detection response", updated: false }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const detection: DetectionResult = JSON.parse(toolCall.function.arguments);
    console.log("Style detection result:", detection);

    // Record analytics
    const analyticsEntry = {
      user_id: userId,
      detected_style: detection.detected_style,
      confidence_score: detection.confidence,
      current_preference: profile.preferred_response_style,
      final_style_used: profile.preferred_response_style,
      message_count: userMessages.length,
      was_auto_updated: false,
    };

    // Only auto-update if confidence >= 0.7 and style differs from current
    let wasUpdated = false;
    if (detection.confidence >= 0.7 && detection.detected_style !== profile.preferred_response_style) {
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ preferred_response_style: detection.detected_style })
        .eq("user_id", userId);

      if (!updateError) {
        wasUpdated = true;
        analyticsEntry.was_auto_updated = true;
        analyticsEntry.final_style_used = detection.detected_style;
        console.log(`Auto-updated user ${userId} style to ${detection.detected_style}`);
      }
    }

    // Insert analytics record
    await supabase.from("response_style_analytics").insert(analyticsEntry);

    return new Response(
      JSON.stringify({
        detected_style: detection.detected_style,
        confidence: detection.confidence,
        reasoning: detection.reasoning,
        updated: wasUpdated,
        previous_style: profile.preferred_response_style,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Detection error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error", updated: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
