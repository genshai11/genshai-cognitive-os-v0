# Fix 3: OpenClaw System Thinking for All Advisors

## Investigation Steps

### Step 1: Check Database for Missing Blueprints

Run these SQL queries in your Supabase SQL Editor:

```sql
-- Check which framework advisors have blueprints
SELECT
    id,
    name,
    (cognitive_blueprint IS NOT NULL) as has_blueprint,
    (cognitive_blueprint IS NOT NULL AND
     cognitive_blueprint::jsonb ? 'reasoning_chain') as has_reasoning,
    created_at
FROM custom_frameworks
ORDER BY created_at DESC;

-- Check which persona advisors have blueprints
SELECT
    id,
    name,
    (cognitive_blueprint IS NOT NULL) as has_blueprint,
    (cognitive_blueprint IS NOT NULL AND
     cognitive_blueprint::jsonb ? 'reasoning_chain') as has_reasoning,
    created_at
FROM custom_personas
ORDER BY created_at DESC;

-- Check which book advisors have blueprints
SELECT
    id,
    title as name,
    (cognitive_blueprint IS NOT NULL) as has_blueprint,
    (cognitive_blueprint IS NOT NULL AND
     cognitive_blueprint::jsonb ? 'reasoning_chain') as has_reasoning,
    created_at
FROM custom_books
ORDER BY created_at DESC;
```

### Step 2: Identify the Issue

The "system thinking" feature is likely embedded in the `reasoning_chain` part of the cognitive blueprint. Check if your advisors have this structure:

```json
{
  "reasoning_chain": {
    "method": "System Thinking / First Principles",
    "steps": [
      "Break down to core components",
      "Question assumptions",
      "Build from fundamentals"
    ],
    "heuristics": [
      "Ask 'why' five times",
      "Look for second-order effects"
    ]
  }
}
```

## Solutions

### Solution 3A: Enable System Thinking for Existing Advisors

If some advisors lack the `reasoning_chain` in their blueprint, you can add it via SQL:

```sql
-- Example: Add system thinking to a specific framework advisor
UPDATE custom_frameworks
SET cognitive_blueprint = jsonb_set(
  COALESCE(cognitive_blueprint, '{}'::jsonb),
  '{reasoning_chain}',
  '{
    "method": "Systems Thinking with First Principles",
    "steps": [
      "Identify system boundaries and components",
      "Map relationships and feedback loops",
      "Break down to first principles",
      "Trace second and third-order effects",
      "Synthesize insights"
    ],
    "heuristics": [
      "Ask why five times to reach root causes",
      "Look for leverage points in the system",
      "Consider what would need to be true",
      "Identify positive and negative feedback loops"
    ]
  }'::jsonb
)
WHERE id = 'YOUR_ADVISOR_ID_HERE';

-- Or update ALL framework advisors at once:
UPDATE custom_frameworks
SET cognitive_blueprint = jsonb_set(
  COALESCE(cognitive_blueprint, '{}'::jsonb),
  '{reasoning_chain}',
  '{
    "method": "Systems Thinking with First Principles",
    "steps": [
      "Identify system boundaries and components",
      "Map relationships and feedback loops",
      "Break down to first principles",
      "Trace second and third-order effects",
      "Synthesize insights"
    ],
    "heuristics": [
      "Ask why five times to reach root causes",
      "Look for leverage points in the system",
      "Consider what would need to be true",
      "Identify positive and negative feedback loops"
    ]
  }'::jsonb
)
WHERE cognitive_blueprint IS NOT NULL;
```

### Solution 3B: Create a Blueprint Template

Create a function to generate proper cognitive blueprints for new advisors:

**File: supabase/functions/_shared/blueprint-template.ts**

```typescript
export interface CognitiveBlueprint {
  worldview: {
    core_axioms: string[];
    ontology: string;
    epistemology: string;
  };
  diagnostic_pattern: {
    perceptual_filters: string[];
    signature_questions: string[];
    red_flags: string[];
  };
  reasoning_chain: {
    method: string;
    steps: string[];
    heuristics: string[];
  };
  emotional_stance: {
    archetype: string;
    relationship_to_user: string;
    tone_markers: string[];
  };
  anti_patterns: string[];
  language_dna: {
    metaphor_domains: string[];
    signature_phrases: string[];
    vocabulary_level: string;
    sentence_rhythm: string;
  };
}

export function getDefaultCognitiveBlueprint(advisorType: 'framework' | 'persona' | 'book'): CognitiveBlueprint {
  return {
    worldview: {
      core_axioms: [
        "Every system has underlying patterns",
        "Context shapes meaning",
        "Truth emerges from rigorous inquiry"
      ],
      ontology: "Reality as interconnected systems",
      epistemology: "Knowledge through systematic analysis and first principles"
    },
    diagnostic_pattern: {
      perceptual_filters: [
        "System boundaries and components",
        "Feedback loops and leverage points",
        "Assumptions and blind spots"
      ],
      signature_questions: [
        "What are we really trying to solve?",
        "What needs to be true for this to work?",
        "What are the second-order effects?"
      ],
      red_flags: [
        "Treating symptoms instead of root causes",
        "Linear thinking in complex systems",
        "Unexamined assumptions"
      ]
    },
    reasoning_chain: {
      method: "Systems Thinking + First Principles",
      steps: [
        "Define system boundaries",
        "Identify core components and relationships",
        "Break down to first principles",
        "Map feedback loops and leverage points",
        "Trace implications and effects",
        "Synthesize insights"
      ],
      heuristics: [
        "Ask 'why' five times to find root causes",
        "Look for positive and negative feedback loops",
        "Identify leverage points with highest impact",
        "Consider what would need to be true",
        "Think in terms of systems, not events"
      ]
    },
    emotional_stance: {
      archetype: "Wise Guide",
      relationship_to_user: "Trusted advisor who asks powerful questions",
      tone_markers: [
        "Curious and probing",
        "Patient but direct",
        "Intellectually rigorous"
      ]
    },
    anti_patterns: [
      "Giving surface-level advice without deep analysis",
      "Accepting assumptions at face value",
      "Ignoring system dynamics and feedback loops",
      "Providing solutions without understanding root causes"
    ],
    language_dna: {
      metaphor_domains: [
        "Systems and networks",
        "Architecture and foundations",
        "Natural ecosystems"
      ],
      signature_phrases: [
        "Let's break this down to first principles",
        "What feedback loops are at play here?",
        "Where are the leverage points?",
        "What would need to be true?"
      ],
      vocabulary_level: "Advanced but accessible",
      sentence_rhythm: "Balanced mix of short insights and longer explorations"
    }
  };
}
```

### Solution 3C: UI Enhancement to Show System Thinking Status

**File: src/components/openclaw/OpenClawExportPanel.tsx**

Add visual indicator for system thinking capability:

```typescript
// In the SelectContent section (around line 103), add an indicator:
<SelectItem key={a.id} value={a.id}>
  <span className="flex items-center gap-2">
    {a.type === 'persona' && <Brain className="w-3.5 h-3.5" />}
    {a.type === 'framework' && <FileText className="w-3.5 h-3.5" />}
    {a.type === 'book' && <FileText className="w-3.5 h-3.5" />}
    {a.name || a.title}
    <span className="text-xs text-muted-foreground">({a.type})</span>
    {/* Add system thinking indicator */}
    {a.hasSystemThinking && (
      <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
        🧠 ST
      </span>
    )}
  </span>
</SelectItem>
```

And update the advisor interface to include the flag:

```typescript
interface Advisor {
  id: string;
  name?: string;
  title?: string;
  type: 'persona' | 'framework' | 'book';
  hasBluePrint: boolean;
  hasSystemThinking?: boolean; // Add this
}
```

## Summary

**The issue**: "System thinking" is not a separate config—it's part of the `cognitive_blueprint.reasoning_chain` structure.

**Why only one advisor has it**: Only advisors with properly structured `cognitive_blueprint.reasoning_chain` will show system thinking behavior in OpenClaw exports.

**The fix**:
1. Run the SQL queries to identify advisors missing the `reasoning_chain`
2. Use Solution 3A to add system thinking to existing advisors
3. Use Solution 3B to ensure new advisors get proper blueprints
4. Optionally use Solution 3C to show which advisors have system thinking in the UI

## Testing

After applying the fixes:

1. Go to OpenClaw Dashboard
2. Select an advisor that previously didn't have system thinking
3. Click "Generate" to export
4. Check the `AGENTS.md` file - you should now see:
   - "## How I Think" section with the reasoning method
   - Steps listed for system thinking process
   - Heuristics for applying the method

The exported OpenClaw config will now properly include system thinking instructions for all advisors with blueprints!
