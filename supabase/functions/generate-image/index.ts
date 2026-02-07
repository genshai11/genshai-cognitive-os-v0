import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { prompt } = await req.json();

        if (!prompt) {
            return new Response(
                JSON.stringify({ error: "Prompt is required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

        if (!LOVABLE_API_KEY) {
            console.error("LOVABLE_API_KEY not configured");
            return new Response(
                JSON.stringify({ error: "API key not configured" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log("Generating image with prompt:", prompt);

        // Use Lovable AI Gateway for image generation
        const response = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "dall-e-3",
                prompt: prompt,
                size: "1024x1024",
                quality: "standard",
                n: 1,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Image generation failed:", errorText);
            return new Response(
                JSON.stringify({ error: "Image generation failed" }),
                { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const data = await response.json();
        const imageUrl = data.data[0]?.url;

        if (!imageUrl) {
            return new Response(
                JSON.stringify({ error: "No image URL returned" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log("Image generated successfully");

        return new Response(
            JSON.stringify({ url: imageUrl }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Error in generate-image function:", error);
        return new Response(
            JSON.stringify({ error: error.message || "Internal server error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
