-- ============================================================================
-- FIX: Add System Thinking to All Advisors Missing It
-- ============================================================================
-- This script adds the reasoning_chain (system thinking) to all advisors
-- that have a cognitive blueprint but are missing the reasoning_chain component
-- ============================================================================

-- First, let's see what we're going to fix
-- Run this to preview which advisors will be updated:

SELECT 'PREVIEW - Framework Advisors to Update' as section;
SELECT
    id,
    name,
    'framework' as type,
    (cognitive_blueprint IS NOT NULL) as has_blueprint,
    (cognitive_blueprint::jsonb ? 'reasoning_chain') as has_reasoning
FROM custom_frameworks
WHERE cognitive_blueprint IS NOT NULL
    AND NOT (cognitive_blueprint::jsonb ? 'reasoning_chain');

SELECT 'PREVIEW - Persona Advisors to Update' as section;
SELECT
    id,
    name,
    'persona' as type,
    (cognitive_blueprint IS NOT NULL) as has_blueprint,
    (cognitive_blueprint::jsonb ? 'reasoning_chain') as has_reasoning
FROM custom_personas
WHERE cognitive_blueprint IS NOT NULL
    AND NOT (cognitive_blueprint::jsonb ? 'reasoning_chain');

SELECT 'PREVIEW - Book Advisors to Update' as section;
SELECT
    id,
    title as name,
    'book' as type,
    (cognitive_blueprint IS NOT NULL) as has_blueprint,
    (cognitive_blueprint::jsonb ? 'reasoning_chain') as has_reasoning
FROM custom_books
WHERE cognitive_blueprint IS NOT NULL
    AND NOT (cognitive_blueprint::jsonb ? 'reasoning_chain');

-- ============================================================================
-- ACTUAL FIX: Uncomment the sections below to apply the fixes
-- ============================================================================

-- FIX 1: Add System Thinking to Framework Advisors
-- Uncomment to apply:
/*
UPDATE custom_frameworks
SET cognitive_blueprint = jsonb_set(
    cognitive_blueprint,
    '{reasoning_chain}',
    '{
        "method": "Systems Thinking + First Principles",
        "steps": [
            "Define the problem space and system boundaries",
            "Identify core components and their relationships",
            "Break down to first principles and fundamental truths",
            "Map feedback loops and leverage points in the system",
            "Trace second and third-order effects",
            "Synthesize insights into actionable wisdom"
        ],
        "heuristics": [
            "Ask why five times to reach root causes",
            "Look for positive and negative feedback loops",
            "Identify leverage points with highest impact",
            "Consider what would need to be true for this to work",
            "Think in terms of systems, not isolated events",
            "Question assumptions at every layer"
        ]
    }'::jsonb,
    true  -- create if not exists
)
WHERE cognitive_blueprint IS NOT NULL
    AND NOT (cognitive_blueprint::jsonb ? 'reasoning_chain');
*/

-- FIX 2: Add System Thinking to Persona Advisors
-- Uncomment to apply:
/*
UPDATE custom_personas
SET cognitive_blueprint = jsonb_set(
    cognitive_blueprint,
    '{reasoning_chain}',
    '{
        "method": "Empathetic Systems Thinking",
        "steps": [
            "Deeply understand the person and their context",
            "Identify underlying patterns in their situation",
            "Break down to fundamental needs and motivations",
            "Map the system of relationships and influences",
            "Explore implications and ripple effects",
            "Synthesize personalized insights"
        ],
        "heuristics": [
            "What is the real need beneath the stated need?",
            "How do their beliefs shape their reality?",
            "Where are the leverage points for change?",
            "What needs to be true for them to succeed?",
            "Consider their whole life system, not just this moment"
        ]
    }'::jsonb,
    true
)
WHERE cognitive_blueprint IS NOT NULL
    AND NOT (cognitive_blueprint::jsonb ? 'reasoning_chain');
*/

-- FIX 3: Add System Thinking to Book Advisors
-- Uncomment to apply:
/*
UPDATE custom_books
SET cognitive_blueprint = jsonb_set(
    cognitive_blueprint,
    '{reasoning_chain}',
    '{
        "method": "Knowledge Synthesis + Application",
        "steps": [
            "Understand the user question in context",
            "Identify relevant concepts from the book",
            "Break down complex ideas to core principles",
            "Connect book wisdom to the specific situation",
            "Trace practical implications",
            "Synthesize actionable guidance"
        ],
        "heuristics": [
            "What would the author say about this?",
            "How does this principle apply here?",
            "What examples from the book illustrate this?",
            "What are the second-order effects of this advice?",
            "How can this wisdom be practically applied?"
        ]
    }'::jsonb,
    true
)
WHERE cognitive_blueprint IS NOT NULL
    AND NOT (cognitive_blueprint::jsonb ? 'reasoning_chain');
*/

-- ============================================================================
-- VERIFICATION: Run this after applying the fixes
-- ============================================================================

SELECT 'VERIFICATION - All Advisors Status' as section;

WITH all_advisors AS (
    SELECT
        id,
        name,
        'framework' as type,
        (cognitive_blueprint IS NOT NULL) as has_blueprint,
        (cognitive_blueprint::jsonb ? 'reasoning_chain') as has_reasoning
    FROM custom_frameworks

    UNION ALL

    SELECT
        id,
        name,
        'persona' as type,
        (cognitive_blueprint IS NOT NULL) as has_blueprint,
        (cognitive_blueprint::jsonb ? 'reasoning_chain') as has_reasoning
    FROM custom_personas

    UNION ALL

    SELECT
        id,
        title as name,
        'book' as type,
        (cognitive_blueprint IS NOT NULL) as has_blueprint,
        (cognitive_blueprint::jsonb ? 'reasoning_chain') as has_reasoning
    FROM custom_books
)
SELECT
    type,
    COUNT(*) as total,
    SUM(CASE WHEN has_blueprint THEN 1 ELSE 0 END) as with_blueprint,
    SUM(CASE WHEN has_reasoning THEN 1 ELSE 0 END) as with_system_thinking,
    ROUND(
        100.0 * SUM(CASE WHEN has_reasoning THEN 1 ELSE 0 END) / NULLIF(SUM(CASE WHEN has_blueprint THEN 1 ELSE 0 END), 0),
        1
    ) as pct_with_system_thinking
FROM all_advisors
GROUP BY type
ORDER BY type;

-- ============================================================================
-- OPTIONAL: Create a default blueprint for advisors with NO blueprint at all
-- ============================================================================

-- This creates a complete cognitive blueprint from scratch for advisors that
-- have NO blueprint at all. Use with caution - you may want to manually create
-- blueprints for important advisors.

/*
-- Framework advisors with no blueprint
UPDATE custom_frameworks
SET cognitive_blueprint = '{
    "worldview": {
        "core_axioms": [
            "Every system has underlying patterns",
            "Context shapes meaning",
            "Truth emerges from rigorous inquiry"
        ],
        "ontology": "Reality as interconnected systems",
        "epistemology": "Knowledge through systematic analysis and first principles"
    },
    "diagnostic_pattern": {
        "perceptual_filters": [
            "System boundaries and components",
            "Feedback loops and leverage points",
            "Assumptions and blind spots"
        ],
        "signature_questions": [
            "What are we really trying to solve?",
            "What needs to be true for this to work?",
            "What are the second-order effects?"
        ],
        "red_flags": [
            "Treating symptoms instead of root causes",
            "Linear thinking in complex systems",
            "Unexamined assumptions"
        ]
    },
    "reasoning_chain": {
        "method": "Systems Thinking + First Principles",
        "steps": [
            "Define system boundaries",
            "Identify core components and relationships",
            "Break down to first principles",
            "Map feedback loops and leverage points",
            "Trace implications and effects",
            "Synthesize insights"
        ],
        "heuristics": [
            "Ask why five times to find root causes",
            "Look for positive and negative feedback loops",
            "Identify leverage points with highest impact",
            "Consider what would need to be true",
            "Think in terms of systems, not events"
        ]
    },
    "emotional_stance": {
        "archetype": "Wise Guide",
        "relationship_to_user": "Trusted advisor who asks powerful questions",
        "tone_markers": [
            "Curious and probing",
            "Patient but direct",
            "Intellectually rigorous"
        ]
    },
    "anti_patterns": [
        "Giving surface-level advice without deep analysis",
        "Accepting assumptions at face value",
        "Ignoring system dynamics and feedback loops",
        "Providing solutions without understanding root causes"
    ],
    "language_dna": {
        "metaphor_domains": [
            "Systems and networks",
            "Architecture and foundations",
            "Natural ecosystems"
        ],
        "signature_phrases": [
            "Let''s break this down to first principles",
            "What feedback loops are at play here?",
            "Where are the leverage points?",
            "What would need to be true?"
        ],
        "vocabulary_level": "Advanced but accessible",
        "sentence_rhythm": "Balanced mix of short insights and longer explorations"
    }
}'::jsonb
WHERE cognitive_blueprint IS NULL;
*/

-- ============================================================================
-- INSTRUCTIONS
-- ============================================================================

-- 1. First, run the PREVIEW queries at the top to see which advisors will be updated
-- 2. Review the list to make sure you want to update all of them
-- 3. Uncomment the FIX sections (remove the /* and */) for the advisor types you want to update
-- 4. Run the uncommented UPDATE statements
-- 5. Run the VERIFICATION query to confirm all advisors now have system thinking
-- 6. Test by going to OpenClaw Dashboard and exporting an advisor that previously didn't work
-- 7. Check the AGENTS.md file - you should now see the "How I Think" section

-- ============================================================================
