// AI Provider Configuration Helper
// Fetches admin AI settings and returns appropriate API configuration

import { createClient } from "npm:@supabase/supabase-js@2";

export interface AIProviderConfig {
    provider: 'lovable' | 'cliproxy' | 'direct';
    apiUrl: string;
    apiKey: string;
    model: string;
    imageModel?: string;
    modelOverrides?: Record<string, string>;
}

export interface AIRequestOptions {
    stream?: boolean;
    max_tokens?: number;
    tools?: any[];
    tool_choice?: any;
    modalities?: string[];
    temperature?: number;
    functionName?: string; // for per-function model overrides and usage tracking
}

// Direct API provider base URLs
const DIRECT_PROVIDER_URLS: Record<string, string> = {
    openai: 'https://api.openai.com/v1/chat/completions',
    anthropic: 'https://api.anthropic.com/v1/messages',
    google: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    openrouter: 'https://openrouter.ai/api/v1/chat/completions',
};

// Default models per direct provider
const DIRECT_DEFAULT_MODELS: Record<string, string> = {
    openai: 'gpt-4o-mini',
    anthropic: 'claude-sonnet-4-5-20250929',
    google: 'gemini-2.0-flash',
    openrouter: 'google/gemini-2.0-flash-exp:free',
};

// In-memory cache (per Deno isolate, ~60s TTL)
let _cachedConfig: AIProviderConfig | null = null;
let _cachedAt = 0;
const CONFIG_CACHE_TTL = 60_000;

// Keep a reference for usage tracking
let _supabaseUrl: string | null = null;
let _supabaseKey: string | null = null;

/**
 * Fetches AI provider configuration from admin settings.
 * Caches result for 60s to avoid DB query on every request.
 * Falls back to Lovable Cloud if other providers are unavailable.
 */
export async function getAIProviderConfig(
    supabaseUrl: string,
    supabaseKey: string
): Promise<AIProviderConfig> {
    _supabaseUrl = supabaseUrl;
    _supabaseKey = supabaseKey;

    const now = Date.now();
    if (_cachedConfig && (now - _cachedAt) < CONFIG_CACHE_TTL) {
        return _cachedConfig;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        const { data: settings, error } = await supabase
            .from('admin_ai_settings')
            .select('*')
            .single();

        if (error || !settings) {
            console.warn('Failed to fetch AI settings, using Lovable Cloud:', error);
            return cacheAndReturn(getLovableConfig());
        }

        const modelOverrides = settings.model_overrides || {};

        switch (settings.provider_type) {
            case 'cliproxy': {
                const config = await getCLIProxyConfig(settings);
                config.modelOverrides = modelOverrides;
                return cacheAndReturn(config);
            }
            case 'direct': {
                const config = await getDirectConfig(settings, supabase);
                config.modelOverrides = modelOverrides;
                return cacheAndReturn(config);
            }
            case 'lovable':
            default: {
                const config = getLovableConfig();
                config.modelOverrides = modelOverrides;
                return cacheAndReturn(config);
            }
        }
    } catch (error) {
        console.error('Error fetching AI provider config:', error);
        return cacheAndReturn(getLovableConfig());
    }
}

function cacheAndReturn(config: AIProviderConfig): AIProviderConfig {
    _cachedConfig = config;
    _cachedAt = Date.now();
    return config;
}

/**
 * Returns Lovable Cloud configuration.
 * Exported so image generation can use Lovable directly.
 */
export function getLovableConfig(): AIProviderConfig {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
        throw new Error("LOVABLE_API_KEY is not configured");
    }

    return {
        provider: 'lovable',
        apiUrl: 'https://ai.gateway.lovable.dev/v1/chat/completions',
        apiKey: LOVABLE_API_KEY,
        model: 'google/gemini-3-flash-preview',
        imageModel: 'google/gemini-2.5-flash-image',
    };
}

/**
 * Returns CLIProxyAPI configuration with fallback to Lovable
 */
async function getCLIProxyConfig(settings: any): Promise<AIProviderConfig> {
    if (!settings.cliproxy_enabled || !settings.cliproxy_url) {
        console.warn('CLIProxyAPI not configured, falling back to Lovable');
        return getLovableConfig();
    }

    try {
        const testUrl = `${settings.cliproxy_url}/v1/models`;
        const response = await fetch(testUrl, {
            method: 'GET',
            signal: AbortSignal.timeout(3000),
        });

        if (!response.ok) {
            console.warn('CLIProxyAPI not reachable, falling back to Lovable');
            return getLovableConfig();
        }

        return {
            provider: 'cliproxy',
            apiUrl: `${settings.cliproxy_url}/v1/chat/completions`,
            apiKey: 'dummy-key',
            model: settings.default_chat_model || 'gemini-2.0-flash-exp',
            imageModel: settings.default_image_model || undefined,
        };
    } catch (error) {
        console.warn('CLIProxyAPI connection failed, falling back to Lovable:', error);
        return getLovableConfig();
    }
}

/**
 * Returns Direct API configuration with fallback to Lovable
 */
async function getDirectConfig(settings: any, supabase: any): Promise<AIProviderConfig> {
    const directProvider = settings.direct_provider;
    const encryptedKey = settings.direct_api_key_encrypted;

    if (!directProvider || !encryptedKey) {
        console.warn('Direct API not configured, falling back to Lovable');
        return getLovableConfig();
    }

    try {
        // Decrypt API key using database function
        const { data, error } = await supabase.rpc('decrypt_api_key', {
            encrypted_key: encryptedKey,
        });

        if (error || !data) {
            console.warn('Failed to decrypt API key, falling back to Lovable:', error);
            return getLovableConfig();
        }

        const apiUrl = settings.direct_api_url
            || DIRECT_PROVIDER_URLS[directProvider]
            || DIRECT_PROVIDER_URLS.openrouter;

        const model = settings.default_chat_model
            || DIRECT_DEFAULT_MODELS[directProvider]
            || 'gpt-4o-mini';

        return {
            provider: 'direct',
            apiUrl,
            apiKey: data,
            model,
            imageModel: settings.default_image_model || undefined,
        };
    } catch (error) {
        console.warn('Direct API config failed, falling back to Lovable:', error);
        return getLovableConfig();
    }
}

/**
 * Returns a config copy with a different model.
 */
export function withModel(config: AIProviderConfig, model: string): AIProviderConfig {
    return { ...config, model };
}

/**
 * Returns a config with per-function model override applied (if configured).
 */
export function withFunctionOverride(config: AIProviderConfig, functionName: string): AIProviderConfig {
    const override = config.modelOverrides?.[functionName];
    if (override) {
        return { ...config, model: override };
    }
    return config;
}

/**
 * Makes AI chat completion request with configured provider.
 * Third parameter accepts AIRequestOptions or boolean (backward compatible).
 */
export async function makeAIChatRequest(
    config: AIProviderConfig,
    messages: any[],
    optionsOrStream: AIRequestOptions | boolean = {}
): Promise<Response> {
    const options: AIRequestOptions = typeof optionsOrStream === 'boolean'
        ? { stream: optionsOrStream }
        : optionsOrStream;

    // Apply per-function model override if functionName provided
    // BUT only if the override model is compatible with the current provider
    let effectiveConfig = config;
    if (options.functionName) {
        const override = config.modelOverrides?.[options.functionName];
        if (override) {
            // Skip OpenRouter-style overrides (containing '/') when using Lovable provider
            const isOpenRouterModel = override.includes('/');
            const isLovable = config.provider === 'lovable';
            if (!isLovable || isOpenRouterModel) {
                // For Lovable, only apply if it's a known Lovable model format
                if (isLovable) {
                    const lovableModels = ['google/gemini-', 'openai/gpt-'];
                    const isValidLovable = lovableModels.some(prefix => override.startsWith(prefix)) && !override.includes(':free');
                    if (isValidLovable) {
                        effectiveConfig = { ...config, model: override };
                    }
                    // else skip the override silently
                } else {
                    effectiveConfig = withFunctionOverride(config, options.functionName);
                }
            }
        }
    }

    const {
        stream = true,
        max_tokens = 8192,
        tools,
        tool_choice,
        modalities,
        temperature,
    } = options;

    const body: Record<string, any> = {
        model: effectiveConfig.model,
        messages,
        stream,
        max_tokens,
    };
    if (tools) body.tools = tools;
    if (tool_choice) body.tool_choice = tool_choice;
    if (modalities) body.modalities = modalities;
    if (temperature !== undefined) body.temperature = temperature;

    const startTime = Date.now();

    const response = await fetch(effectiveConfig.apiUrl, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${effectiveConfig.apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    // Fire-and-forget usage tracking (non-streaming only, streaming is harder to track)
    if (!stream && _supabaseUrl && _supabaseKey) {
        const latencyMs = Date.now() - startTime;
        trackUsage(
            options.functionName || 'unknown',
            effectiveConfig.provider,
            effectiveConfig.model,
            response.status,
            latencyMs,
            effectiveConfig !== config, // was_fallback if model was overridden
        ).catch(() => {}); // silently ignore tracking errors
    }

    return response;
}

/**
 * Convenience wrapper for non-streaming JSON responses.
 * Returns parsed JSON from the AI response.
 */
export async function makeAIJsonRequest(
    config: AIProviderConfig,
    messages: any[],
    options: Omit<AIRequestOptions, 'stream'> = {}
): Promise<any> {
    const response = await makeAIChatRequest(config, messages, {
        ...options,
        stream: false,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI request failed (${response.status}): ${errorText}`);
    }

    return response.json();
}

/**
 * Fire-and-forget usage tracking
 */
async function trackUsage(
    functionName: string,
    provider: string,
    model: string,
    statusCode: number,
    latencyMs: number,
    wasFallback: boolean,
): Promise<void> {
    if (!_supabaseUrl || !_supabaseKey) return;

    try {
        const supabase = createClient(_supabaseUrl, _supabaseKey);
        await supabase.from('ai_provider_usage').insert({
            function_name: functionName,
            provider,
            model,
            status_code: statusCode,
            latency_ms: latencyMs,
            was_fallback: wasFallback,
        });
    } catch {
        // Silently ignore - usage tracking should never break the main flow
    }
}
