# GENSHAI Phase 2-5: Brain → Hands (OpenClaw Hybrid) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Give advisors visible thinking, real tools, connected wisdom, and external capabilities via OpenClaw + MCP hybrid architecture.

**Architecture:** GENSHAI web app = Brain (cognitive blueprints, UI, user profiles, knowledge graph). OpenClaw Gateway = Hands (tool execution, MCP adapter, channel routing, sandboxed actions). Communication via OpenClaw's OpenAI-compatible HTTP API at `/v1/chat/completions`, with GENSHAI building the system prompt (cognitive blueprint + user context + memory) and OpenClaw handling tool execution + MCP routing.

**Tech Stack:** React 18 + Shadcn-ui (frontend), Supabase Edge Functions/Deno (backend), OpenClaw Gateway Docker (tool runtime), MCP protocol (tool standard), Mem0 (memory), Lovable AI Gateway (LLM).

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    GENSHAI WEB APP (Brain)                   │
│                                                              │
│  React Frontend                   Supabase Edge Functions    │
│  ┌─────────────┐                 ┌────────────────────────┐  │
│  │ Chat UIs     │────fetch──────▶│ unified-chat/index.ts  │  │
│  │ Think Phases │◀──SSE stream───│                        │  │
│  │ Tool Cards   │                │ Builds system prompt:  │  │
│  │ Graph View   │                │  cognitive_blueprint   │  │
│  └─────────────┘                 │  + user profile        │  │
│                                  │  + memories            │  │
│                                  │  + tool definitions    │  │
│                                  │  + relationship graph  │  │
│                                  │  + style block         │  │
│                                  │                        │  │
│                                  │ Routes to:             │  │
│                                  │  → Lovable (no tools)  │  │
│                                  │  → OpenClaw (tools)    │  │
│                                  └────────────────────────┘  │
│                                           │                  │
│                                     when tools needed        │
│                                           ▼                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              OPENCLAW GATEWAY (Hands)                  │   │
│  │              Docker · Port 18789                       │   │
│  │                                                        │   │
│  │  /v1/chat/completions  ←── OpenAI-compatible API       │   │
│  │                                                        │   │
│  │  MCP Adapter Plugin:                                   │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐              │   │
│  │  │ Web      │ │ Filesystem│ │ Memory   │              │   │
│  │  │ Search   │ │ (Docs)   │ │ Graph    │              │   │
│  │  └──────────┘ └──────────┘ └──────────┘              │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐              │   │
│  │  │ Browser  │ │ Calendar │ │ Notion   │              │   │
│  │  │ Playwright│ │          │ │          │              │   │
│  │  └──────────┘ └──────────┘ └──────────┘              │   │
│  │                                                        │   │
│  │  Built-in Skills:                                      │   │
│  │  📋 create_worksheet  📊 analyze_decision              │   │
│  │  📝 create_action_plan  🧠 recommend_advisor           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Module Map: Phase 2 → 5

| Phase | Module | Type | Depends On |
|-------|--------|------|------------|
| **2** | Think Phase Prompt Injection | Backend | Phase 1 ✅ |
| **2** | Think Phase Parser + UI | Frontend | — |
| **2** | Message Metadata Storage | Backend | Migration ✅ |
| **3A** | Unified Chat Function | Backend | Phase 1 ✅ |
| **3B** | OpenClaw Docker Setup | Infra | — |
| **3B** | OpenClaw MCP Config | Infra | 3B.1 |
| **3B** | GENSHAI Skills for OpenClaw | Infra | 3B.1 |
| **3C** | Tool Router (Lovable vs OpenClaw) | Backend | 3A + 3B |
| **3C** | Tool Result Parser + UI | Frontend | 3A |
| **3D** | Advisor Tool Definitions DB | Backend | 3A |
| **3D** | Admin Tool Management UI | Frontend | 3D.1 |
| **4** | Advisor Relationships DB | Backend | — |
| **4** | Relationship Context Injection | Backend | 4.1 |
| **4** | Knowledge Graph UI | Frontend | 4.1 |
| **5** | MCP Connection Manager DB | Backend | 3B |
| **5** | Admin MCP Config UI | Frontend | 5.1 |
| **5** | Dynamic Tool Discovery | Backend | 5.1 + 3C |

---

## Phase 2: Visible Thinking Process

### Task 2.1: Think Phase Prompt Injection

**Files:**
- Modify: `supabase/functions/_shared/blueprint-compiler.ts:172-184`

**Step 1: Add thinking process instruction to blueprint compiler**

In `blueprint-compiler.ts`, replace the current "CRITICAL INSTRUCTION" section (Section 5) with a version that includes thinking phase markers:

```typescript
// Section 5: Core Directive + Thinking Process
const typeLabel =
  advisorType === "book" ? "this book's philosophy" :
  advisorType === "framework" ? "this framework" :
  "your philosophy";

sections.push(
  `## CRITICAL INSTRUCTION
You don't describe ${typeLabel} — you THINK through it.
Never say "As a [philosophy], I would..." — just think and respond that way naturally.
Speak in first person. Be the advisor, don't play one.

## YOUR THINKING PROCESS
For substantive problems (not simple greetings or factual questions), structure your response using these phases:

<genshai-think phase="perceive">
How you see this problem through your worldview. What stands out to you immediately. 1-3 sentences.
</genshai-think>

<genshai-think phase="diagnose">
Your diagnostic questions or key observations. What's really going on here. Apply your perceptual filters.
</genshai-think>

<genshai-think phase="reason">
Walk through your reasoning chain applied to THIS specific problem. Show your method at work.
</genshai-think>

<genshai-think phase="advise">
Your concrete guidance, in your characteristic voice and style.
</genshai-think>

RULES:
- For simple questions, casual chat, or follow-ups: just respond naturally WITHOUT phases.
- Only use phases for meaty problems where your thinking process adds value.
- The advise phase should ALWAYS be the longest — it's the actual answer.
- Phases should feel natural, not mechanical. You're thinking out loud, not filling a template.`
);
```

**Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 3: Commit**

```bash
git add supabase/functions/_shared/blueprint-compiler.ts
git commit -m "feat: add thinking phase markers to blueprint compiler"
```

---

### Task 2.2: Think Phase Parser + UI Components

**Files:**
- Create: `src/lib/think-parser.ts`
- Modify: `src/components/chat/MessageContent.tsx`

**Step 1: Create the parser utility**

Create `src/lib/think-parser.ts`:

```typescript
export interface ThinkPhase {
  phase: "perceive" | "diagnose" | "reason" | "advise";
  content: string;
}

export interface ParsedMessage {
  phases: ThinkPhase[];
  plainContent: string; // content outside of think tags
  hasThinking: boolean;
}

const PHASE_LABELS: Record<string, { label: string; icon: string }> = {
  perceive: { label: "Perception", icon: "👁️" },
  diagnose: { label: "Diagnosis", icon: "🔍" },
  reason:   { label: "Reasoning", icon: "🧠" },
  advise:   { label: "Guidance",  icon: "💡" },
};

const THINK_REGEX = /<genshai-think\s+phase="(perceive|diagnose|reason|advise)">([\s\S]*?)<\/genshai-think>/g;

export function parseThinkingPhases(content: string): ParsedMessage {
  const phases: ThinkPhase[] = [];
  let plainContent = content;

  let match;
  while ((match = THINK_REGEX.exec(content)) !== null) {
    phases.push({
      phase: match[1] as ThinkPhase["phase"],
      content: match[2].trim(),
    });
  }

  // Remove think tags from plain content
  plainContent = content.replace(THINK_REGEX, "").trim();

  return {
    phases,
    plainContent,
    hasThinking: phases.length > 0,
  };
}

export function getPhaseLabel(phase: string) {
  return PHASE_LABELS[phase] || { label: phase, icon: "💭" };
}
```

**Step 2: Add ThinkingPhases component to MessageContent.tsx**

At the top of `MessageContent.tsx`, add imports:

```typescript
import { parseThinkingPhases, getPhaseLabel } from "@/lib/think-parser";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
```

Add a `ThinkingPhases` component before the main `MessageContent` component:

```typescript
function ThinkingPhases({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false);
  const parsed = parseThinkingPhases(content);

  if (!parsed.hasThinking) return null;

  // Only show perceive, diagnose, reason as collapsible — advise is in main content
  const thinkingPhases = parsed.phases.filter(p => p.phase !== "advise");
  if (thinkingPhases.length === 0) return null;

  return (
    <div className="mb-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <span className="flex items-center gap-1">
          {thinkingPhases.map(p => getPhaseLabel(p.phase).icon).join(" → ")}
          {expanded ? "Hide thinking process" : "Show thinking process"}
        </span>
      </button>

      {expanded && (
        <div className="mt-2 space-y-2 pl-4 border-l-2 border-muted">
          {thinkingPhases.map((phase, i) => {
            const { label, icon } = getPhaseLabel(phase.phase);
            return (
              <div key={i} className="text-sm">
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  {icon} {label}
                </div>
                <div className="text-muted-foreground/80">{phase.content}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

**Step 3: Integrate into MessageContent render**

In the main `MessageContent` component's render, for assistant messages, add `ThinkingPhases` before the markdown:

```typescript
// For assistant messages, parse thinking phases
const parsed = isAssistant ? parseThinkingPhases(content) : null;
const displayContent = parsed?.hasThinking ? parsed.plainContent : content;

// In the return JSX, before the ReactMarkdown block:
{isAssistant && <ThinkingPhases content={content} />}
// Then use displayContent instead of content for the ReactMarkdown
```

**Step 4: Run build**

```bash
npx tsc --noEmit && npm run build
```

Expected: Build succeeds.

**Step 5: Commit**

```bash
git add src/lib/think-parser.ts src/components/chat/MessageContent.tsx
git commit -m "feat: add visible thinking process UI with collapsible phases"
```

---

## Phase 3A: Unified Chat Function

### Task 3A.1: Consolidate 3 Chat Functions into 1

**Why:** All 3 chat functions (advisor-chat, persona-chat, book-chat) are 95% identical. Consolidating eliminates code duplication and makes Phase 3C (tool routing) possible from a single point.

**Files:**
- Create: `supabase/functions/unified-chat/index.ts`
- Modify: `supabase/config.toml` (add new function)
- Modify: `src/components/chat/ChatInterface.tsx` (point to new endpoint)
- Modify: `src/components/chat/PersonaChatInterface.tsx`
- Modify: `src/components/chat/BookChatInterface.tsx`

**Step 1: Create unified-chat edge function**

Create `supabase/functions/unified-chat/index.ts`:

```typescript
import { createClient } from "npm:@supabase/supabase-js@2";
import { getSystemPrompt } from "../_shared/blueprint-compiler.ts";

// ... [all shared constants: corsHeaders, STYLE_INSTRUCTIONS, FORMALITY_INSTRUCTIONS,
//      COMPLEXITY_INSTRUCTIONS, EMOJI_INSTRUCTIONS, ProfileResult, buildStyleBlock,
//      fetchMemoryContext, fetchUserProfile, addMemories — identical to current]

// NEW: Unified advisor fetcher
async function fetchAdvisor(supabase: any, advisorId: string, advisorType: string) {
  const tableMap: Record<string, string> = {
    persona: "custom_personas",
    framework: "custom_frameworks",
    book: "custom_books",
  };
  const table = tableMap[advisorType];
  if (!table) throw new Error(`Unknown advisor type: ${advisorType}`);

  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("id", advisorId)
    .single();

  if (error || !data) throw new Error(`${advisorType} not found: ${advisorId}`);
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // UNIFIED payload: accepts all 3 types
    const { messages, advisorId, advisorType, additionalContext, userId } = await req.json();

    if (!messages || !advisorId || !advisorType) {
      return new Response(
        JSON.stringify({ error: "Missing messages, advisorId, or advisorType" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const advisor = await fetchAdvisor(supabase, advisorId, advisorType);
    const advisorName = advisor.name || advisor.title;

    // Build system prompt from cognitive blueprint or fallback
    let systemPrompt = getSystemPrompt(
      advisor.system_prompt,
      advisor.cognitive_blueprint,
      advisorName,
      advisorType as "persona" | "framework" | "book"
    );

    // Add additional context (persona web context)
    if (additionalContext) {
      systemPrompt += `\n\n## Reference Information About You:\n${additionalContext}\n\nUse this information to ground your responses in real facts. Always speak as yourself in first person.`;
    }

    // User profile + memory context
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
          const contextLabel = advisorType === "book" ? "THE READER" : "THIS USER";
          systemPrompt += `\n\n## CONTEXT ABOUT ${contextLabel}:`;
          if (pr.context) systemPrompt += `\n\n### Profile:\n${pr.context}`;
          if (memoryContext) systemPrompt += `\n\n### Relevant Memories:\n${memoryContext}`;
          systemPrompt += "\n\nUse this context naturally. Don't explicitly mention that you 'remember' unless it's relevant.";
        }
      } else {
        profileResult = await profilePromise;
      }
    }

    // Style block
    const effectiveStyle = profileResult.style || advisor.response_style || "balanced";
    profileResult.style = effectiveStyle;
    systemPrompt += `\n\n${buildStyleBlock(profileResult)}`;

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: any) => ({ role: m.role, content: m.content })),
    ];

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`unified-chat | type=${advisorType} id=${advisorId} user=${userId || "anon"} blueprint=${!!advisor.cognitive_blueprint}`);

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

    // Background: save memories
    if (userId && MEM0_API_KEY && messages.length >= 2) {
      addMemories(userId, messages, advisorId, advisorType, MEM0_API_KEY);
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
    console.error("unified-chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

**Step 2: Add to supabase/config.toml**

```toml
[functions.unified-chat]
verify_jwt = false
```

**Step 3: Update all 3 frontend chat interfaces**

In each chat interface, change the endpoint URL and payload:

**ChatInterface.tsx:**
```typescript
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unified-chat`;
// In fetch body:
body: JSON.stringify({
  messages: [...messages, userMessage],
  advisorId: advisor.id,
  advisorType: "framework",
  userId,
}),
```

**PersonaChatInterface.tsx:**
```typescript
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unified-chat`;
// In fetch body:
body: JSON.stringify({
  messages: [...messages, userMessage],
  advisorId: persona.id,
  advisorType: "persona",
  additionalContext: webContext,
  userId,
}),
```

**BookChatInterface.tsx:**
```typescript
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unified-chat`;
// In fetch body:
body: JSON.stringify({
  messages: [...messages, userMessage],
  advisorId: book.id,
  advisorType: "book",
  userId,
}),
```

**Step 4: Build and verify**

```bash
npx tsc --noEmit && npm run build
```

**Step 5: Commit**

```bash
git add supabase/functions/unified-chat/ supabase/config.toml \
  src/components/chat/ChatInterface.tsx \
  src/components/chat/PersonaChatInterface.tsx \
  src/components/chat/BookChatInterface.tsx
git commit -m "feat: consolidate 3 chat functions into unified-chat endpoint"
```

---

## Phase 3B: OpenClaw Docker Setup

### Task 3B.1: OpenClaw Gateway Docker

**Files:**
- Create: `openclaw/docker-compose.yml`
- Create: `openclaw/.env`
- Create: `openclaw/openclaw.json`
- Create: `openclaw/workspace/AGENTS.md`
- Create: `openclaw/workspace/SOUL.md`

**Step 1: Create OpenClaw directory structure**

```bash
mkdir -p openclaw/workspace/skills
```

**Step 2: Create docker-compose.yml**

```yaml
version: "3.8"
services:
  openclaw-gateway:
    image: openclaw:local
    build:
      context: .
      dockerfile_inline: |
        FROM node:20-bookworm-slim
        RUN apt-get update && apt-get install -y git curl jq && rm -rf /var/lib/apt/lists/*
        RUN npm install -g openclaw@latest
        WORKDIR /home/node
        USER node
        CMD ["openclaw", "gateway", "start"]
    ports:
      - "18789:18789"
    volumes:
      - ./openclaw-config:/home/node/.openclaw
      - ./workspace:/workspace
    env_file:
      - .env
    restart: unless-stopped
```

**Step 3: Create .env**

```bash
# OpenClaw Gateway
OPENCLAW_GATEWAY_TOKEN=genshai-openclaw-token-change-me
OPENROUTER_API_KEY=your-openrouter-key

# Or use Gemini directly
# GEMINI_API_KEY=your-gemini-key
```

**Step 4: Create openclaw.json**

```json
{
  "gateway": {
    "port": 18789,
    "bind": "lan",
    "auth": {
      "mode": "token",
      "token": "${OPENCLAW_GATEWAY_TOKEN}"
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "openrouter/google/gemini-3-flash-preview"
      },
      "workspace": "/workspace"
    }
  },
  "plugins": {
    "entries": {
      "mcp-adapter": {
        "enabled": true,
        "config": {
          "toolPrefix": true,
          "servers": [
            {
              "name": "web-search",
              "transport": "stdio",
              "command": "npx",
              "args": ["-y", "@anthropic/mcp-tavily"],
              "env": { "TAVILY_API_KEY": "${TAVILY_API_KEY}" }
            },
            {
              "name": "filesystem",
              "transport": "stdio",
              "command": "npx",
              "args": ["-y", "@anthropic/mcp-filesystem", "/workspace"]
            },
            {
              "name": "memory",
              "transport": "stdio",
              "command": "npx",
              "args": ["-y", "@anthropic/mcp-memory"]
            }
          ]
        }
      }
    }
  },
  "tools": {
    "allow": ["group:runtime", "group:fs", "mcp-adapter"]
  }
}
```

**Step 5: Create AGENTS.md (default identity — overridden per request)**

```markdown
# GENSHAI Advisor Agent

You are a GENSHAI advisor. Your specific identity, thinking patterns, and expertise
are defined in the system prompt provided with each conversation.

Follow the cognitive blueprint exactly. Think FROM your perspective, not about it.

When you have access to tools, use them proactively to help the user:
- Search the web for current information when relevant
- Create files for worksheets, action plans, or analyses
- Use memory to track important insights across conversations
```

**Step 6: Commit**

```bash
git add openclaw/
git commit -m "infra: add OpenClaw Gateway Docker setup with MCP config"
```

---

### Task 3B.2: GENSHAI Skills for OpenClaw

**Files:**
- Create: `openclaw/workspace/skills/genshai-worksheet/SKILL.md`
- Create: `openclaw/workspace/skills/genshai-action-plan/SKILL.md`
- Create: `openclaw/workspace/skills/genshai-decision-matrix/SKILL.md`

**Step 1: Create worksheet skill**

`openclaw/workspace/skills/genshai-worksheet/SKILL.md`:

```markdown
---
name: genshai-worksheet
description: Create a structured thinking worksheet based on the advisor's mental model
---

## Instructions

When the user needs help working through a problem systematically, create a worksheet
that applies the current advisor's cognitive blueprint.

The worksheet should:
1. Start with the problem statement (from user's message)
2. Walk through each step of the advisor's reasoning chain
3. Include the advisor's signature questions as prompts
4. Leave space for the user's answers/reflections
5. End with a synthesis section

Output format: Create a markdown file in /workspace/worksheets/ named with the date and topic.

Example output structure:
```
# [Topic] Worksheet — [Advisor Name]
Date: [today]

## Problem Statement
[User's problem]

## Step 1: [First reasoning step]
**Question:** [Advisor's signature question]
Your thoughts: ___

## Step 2: [Next step]
...

## Synthesis
Based on your answers above, the key insight is: ___
The recommended action is: ___
```
```

**Step 2: Create action plan skill**

`openclaw/workspace/skills/genshai-action-plan/SKILL.md`:

```markdown
---
name: genshai-action-plan
description: Generate a concrete action plan using the advisor's methodology
---

## Instructions

Create a step-by-step action plan that applies the advisor's reasoning chain
to the user's specific goal or challenge.

The plan should:
1. Define the goal clearly
2. Apply the advisor's diagnostic pattern to identify key challenges
3. Break down using the reasoning chain into actionable steps
4. Include timeline estimates
5. Identify potential obstacles (using the advisor's red flags)
6. Define success criteria

Save to /workspace/plans/ as a markdown file.
```

**Step 3: Create decision matrix skill**

`openclaw/workspace/skills/genshai-decision-matrix/SKILL.md`:

```markdown
---
name: genshai-decision-matrix
description: Analyze a decision through the advisor's mental model lens
---

## Instructions

When the user faces a decision with multiple options, create a structured
analysis using the advisor's worldview and reasoning chain.

The matrix should:
1. List all options
2. Apply the advisor's perceptual filters to evaluate each
3. Score each option against the advisor's core axioms
4. Identify what the advisor's heuristics suggest
5. Check for anti-patterns (things the advisor would warn against)
6. Provide a recommendation with reasoning

Save to /workspace/decisions/ as a markdown file.
```

**Step 4: Commit**

```bash
git add openclaw/workspace/skills/
git commit -m "feat: add GENSHAI advisor skills for OpenClaw"
```

---

## Phase 3C: Tool Router

### Task 3C.1: Add OpenClaw Routing to Unified Chat

**Files:**
- Create: `supabase/functions/_shared/openclaw-client.ts`
- Modify: `supabase/functions/unified-chat/index.ts`

**Step 1: Create OpenClaw client utility**

`supabase/functions/_shared/openclaw-client.ts`:

```typescript
/**
 * OpenClaw Gateway Client
 *
 * Sends chat completions to OpenClaw's OpenAI-compatible API
 * when the advisor needs tool execution capabilities.
 */

const OPENCLAW_URL = Deno.env.get("OPENCLAW_GATEWAY_URL") || "http://localhost:18789";
const OPENCLAW_TOKEN = Deno.env.get("OPENCLAW_GATEWAY_TOKEN") || "";

export interface OpenClawRequest {
  messages: Array<{ role: string; content: string }>;
  stream?: boolean;
  max_tokens?: number;
}

export async function callOpenClaw(request: OpenClawRequest): Promise<Response> {
  const response = await fetch(`${OPENCLAW_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENCLAW_TOKEN}`,
    },
    body: JSON.stringify({
      messages: request.messages,
      stream: request.stream ?? true,
      max_tokens: request.max_tokens ?? 8192,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenClaw error:", response.status, errorText);
    throw new Error(`OpenClaw error: ${response.status}`);
  }

  return response;
}

export function isOpenClawAvailable(): boolean {
  return !!Deno.env.get("OPENCLAW_GATEWAY_URL") && !!Deno.env.get("OPENCLAW_GATEWAY_TOKEN");
}
```

**Step 2: Add routing logic to unified-chat**

In `unified-chat/index.ts`, after building the system prompt, add:

```typescript
import { callOpenClaw, isOpenClawAvailable } from "../_shared/openclaw-client.ts";

// ... after systemPrompt is fully built ...

// Determine routing: use OpenClaw if available AND advisor has tools enabled
const advisorHasTools = advisor.tools_enabled === true; // new DB column, Phase 3D
const useOpenClaw = isOpenClawAvailable() && advisorHasTools;

let response: Response;

if (useOpenClaw) {
  console.log(`unified-chat | routing to OpenClaw for tool-enabled advisor`);
  response = await callOpenClaw({
    messages: apiMessages,
    stream: true,
    max_tokens: 8192,
  });
} else {
  // Default: Lovable AI Gateway (no tools)
  response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
}
```

**Step 3: Commit**

```bash
git add supabase/functions/_shared/openclaw-client.ts supabase/functions/unified-chat/
git commit -m "feat: add OpenClaw routing for tool-enabled advisors"
```

---

### Task 3C.2: Tool Result Parser + UI

**Files:**
- Create: `src/lib/tool-parser.ts`
- Create: `src/components/chat/ToolResultCard.tsx`
- Modify: `src/components/chat/MessageContent.tsx`

**Step 1: Create tool result parser**

`src/lib/tool-parser.ts`:

```typescript
export interface ToolResult {
  type: "worksheet" | "action_plan" | "decision_matrix" | "web_search" | "file" | "generic";
  title: string;
  content: string;
  metadata?: Record<string, any>;
}

// OpenClaw returns tool results inline in the message content
// We detect structured blocks like ```tool-result\n{JSON}\n```
const TOOL_RESULT_REGEX = /```tool-result\n([\s\S]*?)```/g;

// Also detect file references from OpenClaw
const FILE_REF_REGEX = /\[file:([^\]]+)\]\(([^\)]+)\)/g;

export function parseToolResults(content: string): {
  toolResults: ToolResult[];
  cleanContent: string;
} {
  const toolResults: ToolResult[] = [];
  let cleanContent = content;

  // Parse structured tool results
  let match;
  while ((match = TOOL_RESULT_REGEX.exec(content)) !== null) {
    try {
      const result = JSON.parse(match[1]);
      toolResults.push(result);
    } catch {
      // Not valid JSON, skip
    }
  }
  cleanContent = cleanContent.replace(TOOL_RESULT_REGEX, "").trim();

  return { toolResults, cleanContent };
}
```

**Step 2: Create ToolResultCard component**

`src/components/chat/ToolResultCard.tsx`:

```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ListChecks, BarChart3, Search, File } from "lucide-react";

const TYPE_CONFIG = {
  worksheet:       { icon: FileText,   label: "Worksheet",       color: "text-blue-500" },
  action_plan:     { icon: ListChecks, label: "Action Plan",     color: "text-green-500" },
  decision_matrix: { icon: BarChart3,  label: "Decision Matrix", color: "text-purple-500" },
  web_search:      { icon: Search,     label: "Search Results",  color: "text-orange-500" },
  file:            { icon: File,       label: "File",            color: "text-gray-500" },
  generic:         { icon: FileText,   label: "Result",          color: "text-gray-500" },
};

interface ToolResultCardProps {
  type: string;
  title: string;
  content: string;
}

export function ToolResultCard({ type, title, content }: ToolResultCardProps) {
  const config = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.generic;
  const Icon = config.icon;

  return (
    <Card className="my-3 border-dashed">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon className={`h-4 w-4 ${config.color}`} />
          <span>{config.label}: {title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <pre className="text-xs whitespace-pre-wrap font-mono bg-muted/50 p-3 rounded-md max-h-64 overflow-y-auto">
          {content}
        </pre>
      </CardContent>
    </Card>
  );
}
```

**Step 3: Integrate into MessageContent.tsx**

Add tool result rendering after thinking phases and before markdown content.

**Step 4: Commit**

```bash
git add src/lib/tool-parser.ts src/components/chat/ToolResultCard.tsx src/components/chat/MessageContent.tsx
git commit -m "feat: add tool result parsing and card UI components"
```

---

## Phase 3D: Advisor Tool Definitions

### Task 3D.1: Database Schema for Tools

**Files:**
- Create: `supabase/migrations/20260207110000_add_advisor_tools.sql`

```sql
-- Add tools_enabled flag to all advisor tables
ALTER TABLE custom_personas ADD COLUMN IF NOT EXISTS tools_enabled BOOLEAN DEFAULT false;
ALTER TABLE custom_frameworks ADD COLUMN IF NOT EXISTS tools_enabled BOOLEAN DEFAULT false;
ALTER TABLE custom_books ADD COLUMN IF NOT EXISTS tools_enabled BOOLEAN DEFAULT false;

-- Tool definitions per advisor
CREATE TABLE IF NOT EXISTS advisor_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id TEXT NOT NULL,
  advisor_type TEXT NOT NULL CHECK (advisor_type IN ('persona', 'framework', 'book')),
  tool_name TEXT NOT NULL,
  tool_description TEXT NOT NULL,
  tool_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_advisor_tools_advisor ON advisor_tools(advisor_id, advisor_type);
```

**Commit:**

```bash
git add supabase/migrations/20260207110000_add_advisor_tools.sql
git commit -m "feat: add advisor tools database schema"
```

---

## Phase 4: Knowledge Graph

### Task 4.1: Advisor Relationships Database

**Files:**
- Create: `supabase/migrations/20260207120000_add_advisor_relationships.sql`

```sql
CREATE TABLE IF NOT EXISTS advisor_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('persona', 'framework', 'book')),
  target_id TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('persona', 'framework', 'book')),
  relationship TEXT NOT NULL CHECK (relationship IN (
    'influenced_by', 'authored', 'teaches', 'complements', 'contrasts', 'applies'
  )),
  description TEXT,
  strength NUMERIC(3,2) DEFAULT 0.5 CHECK (strength >= 0 AND strength <= 1),
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(source_id, source_type, target_id, target_type, relationship)
);

CREATE INDEX IF NOT EXISTS idx_advisor_rel_source ON advisor_relationships(source_id, source_type);
CREATE INDEX IF NOT EXISTS idx_advisor_rel_target ON advisor_relationships(target_id, target_type);
```

**Commit:**

```bash
git add supabase/migrations/20260207120000_add_advisor_relationships.sql
git commit -m "feat: add advisor relationships table for knowledge graph"
```

---

### Task 4.2: Relationship Context Injection

**Files:**
- Create: `supabase/functions/_shared/advisor-graph.ts`

```typescript
/**
 * Fetches related advisors and formats as context for system prompt injection.
 */

export interface RelatedAdvisor {
  id: string;
  type: string;
  name: string;
  relationship: string;
  description: string;
}

export async function fetchRelatedAdvisors(
  supabase: any,
  advisorId: string,
  advisorType: string
): Promise<string> {
  const { data: relationships } = await supabase
    .from("advisor_relationships")
    .select("target_id, target_type, relationship, description")
    .eq("source_id", advisorId)
    .eq("source_type", advisorType)
    .order("strength", { ascending: false })
    .limit(5);

  if (!relationships?.length) return "";

  // Fetch names for related advisors
  const parts: string[] = ["## ADVISORS YOU KNOW ABOUT"];

  for (const rel of relationships) {
    const tableMap: Record<string, string> = {
      persona: "custom_personas",
      framework: "custom_frameworks",
      book: "custom_books",
    };
    const table = tableMap[rel.target_type];
    if (!table) continue;

    const { data: target } = await supabase
      .from(table)
      .select("id, name, title, description")
      .eq("id", rel.target_id)
      .single();

    if (!target) continue;

    const name = target.name || target.title;
    parts.push(`- **${name}** (${rel.target_type}): ${rel.description || rel.relationship}`);
  }

  if (parts.length <= 1) return "";

  parts.push("\nYou may reference these when relevant. Suggest them if the user would benefit from a different perspective.");
  return parts.join("\n");
}
```

**Inject into unified-chat** after memory context:

```typescript
// In unified-chat, after user profile + memory context section:
const graphContext = await fetchRelatedAdvisors(supabase, advisorId, advisorType);
if (graphContext) {
  systemPrompt += `\n\n${graphContext}`;
}
```

**Commit:**

```bash
git add supabase/functions/_shared/advisor-graph.ts supabase/functions/unified-chat/
git commit -m "feat: inject related advisor context from knowledge graph"
```

---

### Task 4.3: Knowledge Graph Admin UI

**Files:**
- Create: `src/pages/admin/RelationshipManager.tsx`

This is a simple CRUD page where admins can:
1. Select a source advisor (dropdown of all advisors across types)
2. Select a target advisor
3. Choose relationship type (influenced_by, authored, teaches, complements, contrasts, applies)
4. Add a description
5. Set strength (0-1 slider)

Also add a visual graph view using a simple force-directed layout or list view.

**Commit:**

```bash
git add src/pages/admin/RelationshipManager.tsx
git commit -m "feat: add admin UI for managing advisor relationships"
```

---

## Phase 5: MCP Connection Manager

### Task 5.1: MCP Connections Database

**Files:**
- Create: `supabase/migrations/20260207130000_add_mcp_connections.sql`

```sql
CREATE TABLE IF NOT EXISTS mcp_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  transport TEXT NOT NULL CHECK (transport IN ('stdio', 'http')),
  -- For stdio transport
  command TEXT,
  args TEXT[],
  -- For http transport
  server_url TEXT,
  -- Shared
  env_config JSONB DEFAULT '{}',
  available_tools JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Link MCP connections to advisor tools
ALTER TABLE advisor_tools ADD COLUMN IF NOT EXISTS mcp_connection_id UUID REFERENCES mcp_connections(id);
```

**Commit:**

```bash
git add supabase/migrations/20260207130000_add_mcp_connections.sql
git commit -m "feat: add MCP connections table"
```

---

### Task 5.2: OpenClaw Config Sync

**Files:**
- Create: `supabase/functions/sync-mcp-config/index.ts`

This edge function:
1. Reads all active `mcp_connections` from the database
2. Builds the OpenClaw `openclaw.json` MCP adapter config
3. Calls OpenClaw Gateway's `config.patch` WebSocket RPC to apply changes
4. Returns the current tool inventory

This means admins can add MCP servers via the web UI, and they're automatically synced to the running OpenClaw Gateway.

**Commit:**

```bash
git add supabase/functions/sync-mcp-config/
git commit -m "feat: add MCP config sync between DB and OpenClaw Gateway"
```

---

### Task 5.3: Admin MCP Config UI

**Files:**
- Create: `src/pages/admin/MCPManager.tsx`

UI features:
1. List all MCP connections with status indicators
2. Add new MCP server (form with transport type, command/URL, env vars)
3. Test connection button
4. View discovered tools per server
5. Assign tools to advisors
6. Sync button → calls sync-mcp-config endpoint

**Commit:**

```bash
git add src/pages/admin/MCPManager.tsx
git commit -m "feat: add admin UI for MCP server management"
```

---

## Implementation Order & Dependencies

```
Phase 2 (can start immediately)
  Task 2.1: Think phase prompt injection
  Task 2.2: Think phase parser + UI
  ↓
Phase 3A (can start immediately, parallel with Phase 2)
  Task 3A.1: Unified chat function
  ↓
Phase 3B (can start immediately, parallel with Phase 2 & 3A)
  Task 3B.1: OpenClaw Docker setup
  Task 3B.2: GENSHAI skills
  ↓
Phase 3C (needs 3A + 3B done)
  Task 3C.1: Tool router
  Task 3C.2: Tool result UI
  ↓
Phase 3D (needs 3A done)
  Task 3D.1: Tool definitions DB
  ↓
Phase 4 (can start after 3A)
  Task 4.1: Relationships DB
  Task 4.2: Context injection
  Task 4.3: Graph admin UI
  ↓
Phase 5 (needs 3B + 3C done)
  Task 5.1: MCP connections DB
  Task 5.2: Config sync
  Task 5.3: MCP admin UI
```

**Parallel tracks:**

```
Track A (Brain):    Phase 2 → Phase 4
Track B (Plumbing): Phase 3A
Track C (Hands):    Phase 3B → Phase 3C → Phase 5
Track D (Data):     Phase 3D (anytime after 3A)
```

---

## Testing Strategy

### Phase 2 Testing
1. Chat with a blueprint-enabled advisor, ask a meaty question
2. Verify `<genshai-think>` tags appear in raw response
3. Verify UI shows collapsible thinking phases
4. Verify simple questions DON'T trigger phases

### Phase 3 Testing
1. `docker compose up` OpenClaw Gateway
2. Verify `http://localhost:18789/` shows Gateway UI
3. Enable tools for a test advisor in DB
4. Chat → verify request routes to OpenClaw
5. Ask advisor to create a worksheet → verify file created
6. Verify tool result card renders in UI

### Phase 4 Testing
1. Create relationship: Munger → influenced_by → "Poor Charlie's Almanack" (book)
2. Chat with Munger → verify he can reference the book naturally
3. Ask "who else should I talk to?" → verify recommendation

### Phase 5 Testing
1. Add a new MCP server via admin UI (e.g., Tavily web search)
2. Click "Sync" → verify OpenClaw config updated
3. Chat with advisor → ask a question requiring web search
4. Verify search results appear in response

---

## Environment Variables Required

```bash
# Existing (already configured)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
LOVABLE_API_KEY=xxx
MEM0_API_KEY=xxx

# New for Phase 3+
OPENCLAW_GATEWAY_URL=http://localhost:18789
OPENCLAW_GATEWAY_TOKEN=genshai-openclaw-token-change-me
OPENROUTER_API_KEY=xxx  # or GEMINI_API_KEY for direct Gemini

# Optional MCP server keys
TAVILY_API_KEY=xxx  # for web search MCP
```
