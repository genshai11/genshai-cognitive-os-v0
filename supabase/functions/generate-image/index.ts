import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getLovableConfig, makeAIChatRequest, withModel } from "../_shared/ai-provider.ts";

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

        console.log("Generating image with prompt:", prompt);

        // Image generation always uses Lovable gateway — the google/gemini-2.5-flash-image
        // model with modalities:["image","text"] is Lovable-gateway-specific and not
        // available on CLIProxyAPI or direct API endpoints.
        const lovableConfig = getLovableConfig();
        const imageConfig = withModel(lovableConfig, lovableConfig.imageModel || 'google/gemini-2.5-flash-image');

        const response = await makeAIChatRequest(imageConfig, [
            { role: "user", content: prompt }
        ], {
            stream: false,
            modalities: ["image", "text"],
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
        const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!imageUrl) {
            console.error("No image in response:", JSON.stringify(data).slice(0, 500));
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
