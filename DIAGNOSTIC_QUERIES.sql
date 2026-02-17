-- Diagnostic SQL Queries for Issue Investigation
-- Run these in Supabase SQL Editor to investigate the issues

-- ============================================================================
-- ISSUE 3: Check which advisors have cognitive blueprints with system thinking
-- ============================================================================

-- Framework Advisors
SELECT
    id,
    name,
    (cognitive_blueprint IS NOT NULL) as has_blueprint,
    (cognitive_blueprint::jsonb -> 'reasoning_chain') IS NOT NULL as has_reasoning_chain,
    (cognitive_blueprint::jsonb -> 'reasoning_chain' -> 'method')::text as thinking_method,
    array_length(
        COALESCE((cognitive_blueprint::jsonb -> 'reasoning_chain' -> 'steps')::jsonb, '[]'::jsonb)::text[],
        1
    ) as num_thinking_steps,
    created_at
FROM custom_frameworks
ORDER BY created_at DESC;

-- Persona Advisors
SELECT
    id,
    name,
    (cognitive_blueprint IS NOT NULL) as has_blueprint,
    (cognitive_blueprint::jsonb -> 'reasoning_chain') IS NOT NULL as has_reasoning_chain,
    (cognitive_blueprint::jsonb -> 'reasoning_chain' -> 'method')::text as thinking_method,
    array_length(
        COALESCE((cognitive_blueprint::jsonb -> 'reasoning_chain' -> 'steps')::jsonb, '[]'::jsonb)::text[],
        1
    ) as num_thinking_steps,
    created_at
FROM custom_personas
ORDER BY created_at DESC;

-- Book Advisors
SELECT
    id,
    title as name,
    (cognitive_blueprint IS NOT NULL) as has_blueprint,
    (cognitive_blueprint::jsonb -> 'reasoning_chain') IS NOT NULL as has_reasoning_chain,
    (cognitive_blueprint::jsonb -> 'reasoning_chain' -> 'method')::text as thinking_method,
    array_length(
        COALESCE((cognitive_blueprint::jsonb -> 'reasoning_chain' -> 'steps')::jsonb, '[]'::jsonb)::text[],
        1
    ) as num_thinking_steps,
    created_at
FROM custom_books
ORDER BY created_at DESC;

-- ============================================================================
-- Get detailed blueprint structure for a specific advisor
-- ============================================================================

-- Replace 'YOUR_ADVISOR_ID' with actual ID
SELECT
    id,
    name,
    jsonb_pretty(cognitive_blueprint) as blueprint_structure
FROM custom_frameworks
WHERE id = 'YOUR_ADVISOR_ID';

-- ============================================================================
-- Check AI Provider Configuration
-- ============================================================================

SELECT
    provider_type,
    cliproxy_enabled,
    cliproxy_url,
    default_chat_model,
    default_image_model,
    direct_provider,
    (direct_api_key_encrypted IS NOT NULL) as has_api_key,
    direct_api_url,
    model_overrides
FROM admin_ai_settings;

-- ============================================================================
-- Check Image Generation Usage (if ai_provider_usage table exists)
-- ============================================================================

SELECT
    function_name,
    provider,
    model,
    status_code,
    AVG(latency_ms) as avg_latency_ms,
    COUNT(*) as request_count,
    SUM(CASE WHEN was_fallback THEN 1 ELSE 0 END) as fallback_count
FROM ai_provider_usage
WHERE function_name = 'generate-image'
    AND created_at > NOW() - INTERVAL '7 days'
GROUP BY function_name, provider, model, status_code
ORDER BY created_at DESC;

-- ============================================================================
-- Count advisors by type and blueprint status
-- ============================================================================

SELECT
    'framework' as type,
    COUNT(*) as total,
    SUM(CASE WHEN cognitive_blueprint IS NOT NULL THEN 1 ELSE 0 END) as with_blueprint,
    SUM(CASE WHEN cognitive_blueprint::jsonb ? 'reasoning_chain' THEN 1 ELSE 0 END) as with_system_thinking
FROM custom_frameworks

UNION ALL

SELECT
    'persona' as type,
    COUNT(*) as total,
    SUM(CASE WHEN cognitive_blueprint IS NOT NULL THEN 1 ELSE 0 END) as with_blueprint,
    SUM(CASE WHEN cognitive_blueprint::jsonb ? 'reasoning_chain' THEN 1 ELSE 0 END) as with_system_thinking
FROM custom_personas

UNION ALL

SELECT
    'book' as type,
    COUNT(*) as total,
    SUM(CASE WHEN cognitive_blueprint IS NOT NULL THEN 1 ELSE 0 END) as with_blueprint,
    SUM(CASE WHEN cognitive_blueprint::jsonb ? 'reasoning_chain' THEN 1 ELSE 0 END) as with_system_thinking
FROM custom_books;

-- ============================================================================
-- Find advisor with the most complete blueprint (use as template)
-- ============================================================================

WITH all_advisors AS (
    SELECT
        id,
        name,
        'framework' as type,
        cognitive_blueprint
    FROM custom_frameworks
    WHERE cognitive_blueprint IS NOT NULL

    UNION ALL

    SELECT
        id,
        name,
        'persona' as type,
        cognitive_blueprint
    FROM custom_personas
    WHERE cognitive_blueprint IS NOT NULL

    UNION ALL

    SELECT
        id,
        title as name,
        'book' as type,
        cognitive_blueprint
    FROM custom_books
    WHERE cognitive_blueprint IS NOT NULL
)
SELECT
    id,
    name,
    type,
    (cognitive_blueprint::jsonb ? 'worldview') as has_worldview,
    (cognitive_blueprint::jsonb ? 'reasoning_chain') as has_reasoning,
    (cognitive_blueprint::jsonb ? 'diagnostic_pattern') as has_diagnostic,
    (cognitive_blueprint::jsonb ? 'emotional_stance') as has_emotional,
    (cognitive_blueprint::jsonb ? 'language_dna') as has_language,
    (cognitive_blueprint::jsonb ? 'anti_patterns') as has_anti_patterns,
    -- Count how complete the blueprint is
    (
        CASE WHEN cognitive_blueprint::jsonb ? 'worldview' THEN 1 ELSE 0 END +
        CASE WHEN cognitive_blueprint::jsonb ? 'reasoning_chain' THEN 1 ELSE 0 END +
        CASE WHEN cognitive_blueprint::jsonb ? 'diagnostic_pattern' THEN 1 ELSE 0 END +
        CASE WHEN cognitive_blueprint::jsonb ? 'emotional_stance' THEN 1 ELSE 0 END +
        CASE WHEN cognitive_blueprint::jsonb ? 'language_dna' THEN 1 ELSE 0 END +
        CASE WHEN cognitive_blueprint::jsonb ? 'anti_patterns' THEN 1 ELSE 0 END
    ) as completeness_score
FROM all_advisors
ORDER BY completeness_score DESC, name;

-- ============================================================================
-- Export a complete blueprint as template (replace YOUR_BEST_ADVISOR_ID)
-- ============================================================================

SELECT jsonb_pretty(cognitive_blueprint) as template_blueprint
FROM custom_frameworks
WHERE id = 'YOUR_BEST_ADVISOR_ID';
