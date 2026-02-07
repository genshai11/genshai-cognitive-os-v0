# Phase 2: User-Requested Skill Generation - Implementation Plan

**Project:** MindBoard - Dynamic Skill Creator System
**Phase:** Phase 2 - User-Requested with Approval
**Date:** February 7, 2026

---

## Executive Summary

Enable advisors to generate custom skills/tools on-demand when users explicitly request them. Users review and approve generated code before execution. This provides flexibility without the security risks of autonomous code generation.

**Key Principle:** User requests → Advisor generates → User approves → System executes

---

## User Flow

### **Scenario 1: User Explicitly Requests a Skill**

```
User: "Warren, can you create a DCF calculator to help me value stocks?"

Warren Buffett: "Absolutely. I'll create a Discounted Cash Flow calculator
based on my value investing principles. Let me generate that for you..."

[System generates skill using structured outputs]

Warren: "I've created a DCF Calculator skill. Here's what it does:
- Calculates intrinsic value based on projected cash flows
- Uses your specified discount rate and growth assumptions
- Includes margin of safety analysis

The code I generated:
[Shows code preview with syntax highlighting]

Would you like to review the code and approve it?"

User: [Reviews code] "Looks good, approve!"

Warren: "Great! The skill is now active. Let me use it to analyze the
stock you're interested in..."

[Executes skill with user's data]
[Shows results with Warren's commentary]
```

### **Scenario 2: Advisor Suggests Creating a Skill**

```
User: "How should I think about risk in my portfolio?"

Ray Dalio: "Let me think about this using my All Weather Portfolio
framework. Actually, this would be much clearer if I had a correlation
analysis tool.

Would you like me to create a 'Portfolio Correlation Analyzer' skill?
It would help visualize how different assets move together."

User: "Yes, create it!"

[Skill generation flow as above]
```

### **Scenario 3: Reusing Previously Created Skills**

```
User: "Warren, should I buy Apple stock?"

Warren: "I'll use my DCF Calculator (created on Jan 15) to analyze Apple..."

[Executes existing skill]
```

---

## Technical Architecture

### **Architecture Diagram**

```
┌─────────────────────────────────────────────────┐
│           USER INTERFACE (React)                │
│  - Chat input: "Create a DCF calculator"       │
│  - Skill approval modal (shows code)           │
│  - Skill library viewer                        │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│        SUPABASE EDGE FUNCTIONS                  │
│  ┌──────────────────────────────────────────┐  │
│  │  /advisor-chat (existing)                │  │
│  │  - Detects skill generation requests     │  │
│  │  - Calls skill-generator if needed       │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │  /skill-generator (NEW)                  │  │
│  │  - Uses Anthropic Structured Outputs     │  │
│  │  - Generates SkillDefinition JSON        │  │
│  │  - Returns to user for approval          │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │  /skill-executor (NEW)                   │  │
│  │  - Runs approved skills in sandbox       │  │
│  │  - Returns results to advisor            │  │
│  └──────────────────────────────────────────┘  │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│        DATABASE (Supabase PostgreSQL)           │
│  - advisor_skills (generated skills)            │
│  - skill_executions (usage logs)                │
│  - skill_approvals (user approvals)             │
└─────────────────────────────────────────────────┘
```

---

## Database Schema

### **1. Advisor Skills Table**

```sql
CREATE TABLE advisor_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  advisor_id TEXT NOT NULL,

  -- Skill identity
  skill_id TEXT NOT NULL, -- e.g., "dcf-calculator"
  skill_name TEXT NOT NULL,
  skill_description TEXT NOT NULL,
  category TEXT, -- 'analysis', 'calculation', 'research', etc.

  -- Schema definitions (for validation)
  input_schema JSONB NOT NULL,
  output_schema JSONB NOT NULL,

  -- Code
  code TEXT NOT NULL, -- JavaScript/TypeScript function code
  language TEXT DEFAULT 'javascript',

  -- Metadata
  mental_model TEXT, -- Which mental model this supports
  use_cases TEXT[],
  examples JSONB, -- Array of {input, output, explanation}

  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'archived'
  approved_at TIMESTAMPTZ,

  -- Usage tracking
  times_used INT DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  -- Versioning
  version TEXT DEFAULT '1.0.0',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id, advisor_id, skill_id)
);

-- Indexes
CREATE INDEX idx_advisor_skills_user_id ON advisor_skills(user_id);
CREATE INDEX idx_advisor_skills_advisor ON advisor_skills(advisor_id);
CREATE INDEX idx_advisor_skills_status ON advisor_skills(status);

-- RLS Policies
ALTER TABLE advisor_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own skills"
  ON advisor_skills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own skills"
  ON advisor_skills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skills"
  ON advisor_skills FOR UPDATE
  USING (auth.uid() = user_id);
```

### **2. Skill Executions Table**

```sql
CREATE TABLE skill_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  skill_id UUID REFERENCES advisor_skills(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Execution details
  input JSONB NOT NULL,
  output JSONB,

  -- Performance
  execution_time_ms INT,
  success BOOLEAN NOT NULL,
  error_message TEXT,

  -- Timestamp
  executed_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_skill_executions_skill_id ON skill_executions(skill_id);
CREATE INDEX idx_skill_executions_user_id ON skill_executions(user_id);

-- RLS
ALTER TABLE skill_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own executions"
  ON skill_executions FOR SELECT
  USING (auth.uid() = user_id);
```

### **3. Update Conversations Table**

```sql
-- Add field to track which skills were used
ALTER TABLE conversations ADD COLUMN skills_used JSONB DEFAULT '[]';
-- Stores array of skill IDs used in this conversation
```

---

## TypeScript Interfaces

### **Core Interfaces**

```typescript
// src/types/skills.ts

export interface SkillDefinition {
  id: string; // UUID from database
  skillId: string; // e.g., "dcf-calculator"
  userId: string;
  advisorId: string;

  // Metadata
  name: string;
  description: string;
  category: 'analysis' | 'calculation' | 'research' | 'creative' | 'communication';
  mentalModel?: string;

  // Schema
  inputSchema: JSONSchema;
  outputSchema: JSONSchema;

  // Code
  code: string;
  language: 'javascript' | 'typescript';

  // Examples
  useCases: string[];
  examples: SkillExample[];

  // Status
  status: 'pending' | 'approved' | 'rejected' | 'archived';
  approvedAt?: Date;

  // Usage
  timesUsed: number;
  lastUsedAt?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  version: string;
}

export interface SkillExample {
  input: Record<string, any>;
  output: any;
  explanation: string;
}

export interface JSONSchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  items?: any;
  enum?: any[];
  // ... standard JSON Schema fields
}

export interface SkillExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  executionTimeMs: number;
}

export interface SkillGenerationRequest {
  conversationId: string;
  advisorId: string;
  skillDescription: string; // What the user wants
  context?: string; // Additional context from conversation
}
```

---

## Supabase Edge Functions

### **Function 1: Skill Generator**

**File:** `supabase/functions/skill-generator/index.ts`

```typescript
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
});

// Structured output schema for skill generation
const skillGenerationSchema = {
  type: "object",
  properties: {
    skillId: {
      type: "string",
      pattern: "^[a-z0-9-]+$",
      description: "Kebab-case ID for the skill"
    },
    name: {
      type: "string",
      description: "Human-friendly name"
    },
    description: {
      type: "string",
      description: "What this skill does"
    },
    category: {
      type: "string",
      enum: ["analysis", "calculation", "research", "creative", "communication"]
    },
    mentalModel: {
      type: "string",
      description: "Which mental model/framework this uses"
    },
    inputSchema: {
      type: "object",
      properties: {
        type: { const: "object" },
        properties: { type: "object" },
        required: { type: "array", items: { type: "string" } }
      },
      required: ["type", "properties"]
    },
    outputSchema: {
      type: "object",
      properties: {
        type: { type: "string" },
        properties: { type: "object" }
      },
      required: ["type"]
    },
    code: {
      type: "string",
      description: "Complete JavaScript function code"
    },
    useCases: {
      type: "array",
      items: { type: "string" },
      minItems: 1
    },
    examples: {
      type: "array",
      items: {
        type: "object",
        properties: {
          input: { type: "object" },
          output: {},
          explanation: { type: "string" }
        },
        required: ["input", "output", "explanation"]
      },
      minItems: 1
    }
  },
  required: [
    "skillId", "name", "description", "category",
    "inputSchema", "outputSchema", "code", "useCases", "examples"
  ]
};

Deno.serve(async (req) => {
  try {
    const { advisorId, skillDescription, context } = await req.json();

    // Get advisor details
    const advisor = getAdvisor(advisorId); // Import from shared lib

    // Generate skill using structured outputs
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,

      // Enable structured outputs
      headers: {
        'anthropic-beta': 'structured-outputs-2025-11-13'
      },

      system: `You are ${advisor.name}. ${advisor.systemPrompt}

SKILL CREATION TASK:
You have the ability to create custom skills/tools to enhance your advisory capabilities.

When creating a skill:
1. Stay true to your mental models and principles
2. Write clean, well-documented JavaScript code
3. Include concrete examples that demonstrate usage
4. Explain the mental model/framework behind the skill
5. Make it reusable and general-purpose

CODE GUIDELINES:
- Write pure JavaScript (ES6+)
- Use clear variable names
- Add comments explaining logic
- Handle edge cases
- Return structured objects that match outputSchema
- Don't use external libraries (unless absolutely necessary)

EXAMPLE STRUCTURE:
\`\`\`javascript
function calculateSomething(input) {
  const { param1, param2 } = input;

  // Your logic here
  const result = param1 * param2;

  return {
    result,
    explanation: "Detailed explanation...",
    recommendations: ["Tip 1", "Tip 2"]
  };
}
\`\`\`

${context ? `CONVERSATION CONTEXT:\n${context}` : ''}`,

      messages: [{
        role: 'user',
        content: `Please create a skill for: ${skillDescription}

Generate a complete skill definition with:
- Appropriate input/output schemas
- Working JavaScript code
- Concrete examples
- Your expert commentary`
      }],

      // Enforce structured output
      tools: [{
        name: 'create_skill',
        description: 'Generate a new skill/tool definition',
        input_schema: skillGenerationSchema
      }],
      tool_choice: { type: 'tool', name: 'create_skill' }
    });

    // Extract generated skill
    const toolUse = response.content.find(c => c.type === 'tool_use');

    if (!toolUse) {
      throw new Error('No skill generated');
    }

    const generatedSkill = toolUse.input;

    // Add version and metadata
    const skillDefinition: SkillDefinition = {
      ...generatedSkill,
      advisorId,
      status: 'pending', // Needs user approval
      version: '1.0.0',
      language: 'javascript',
      timesUsed: 0,
      createdAt: new Date()
    };

    return new Response(
      JSON.stringify({ skill: skillDefinition }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Skill generation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to get advisor details
function getAdvisor(advisorId: string) {
  // Import from your lib/persona-advisors.ts or lib/advisors.ts
  // Return advisor with systemPrompt, name, etc.
}
```

### **Function 2: Skill Executor**

**File:** `supabase/functions/skill-executor/index.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  try {
    const { skillId, input, userId, conversationId } = await req.json();

    // 1. Get skill from database
    const { data: skill, error: fetchError } = await supabase
      .from('advisor_skills')
      .select('*')
      .eq('id', skillId)
      .eq('user_id', userId)
      .eq('status', 'approved') // Only execute approved skills
      .single();

    if (fetchError || !skill) {
      throw new Error('Skill not found or not approved');
    }

    // 2. Validate input against schema
    const inputValid = validateInput(input, skill.input_schema);
    if (!inputValid.valid) {
      throw new Error(`Invalid input: ${inputValid.errors.join(', ')}`);
    }

    // 3. Execute skill in sandbox
    const startTime = Date.now();
    let output: any;
    let success = true;
    let errorMessage: string | undefined;

    try {
      output = await executeInSandbox(skill.code, input);

      // Validate output
      const outputValid = validateOutput(output, skill.output_schema);
      if (!outputValid.valid) {
        throw new Error(`Invalid output: ${outputValid.errors.join(', ')}`);
      }
    } catch (execError) {
      success = false;
      errorMessage = execError.message;
      console.error('Execution error:', execError);
    }

    const executionTimeMs = Date.now() - startTime;

    // 4. Log execution
    await supabase.from('skill_executions').insert({
      skill_id: skillId,
      conversation_id: conversationId,
      user_id: userId,
      input,
      output,
      execution_time_ms: executionTimeMs,
      success,
      error_message: errorMessage
    });

    // 5. Update skill usage stats
    await supabase.rpc('increment_skill_usage', {
      skill_id: skillId
    });

    // 6. Return result
    return new Response(
      JSON.stringify({
        success,
        output,
        error: errorMessage,
        executionTimeMs
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Skill execution error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// Sandbox execution using Deno's isolate
async function executeInSandbox(code: string, input: any): Promise<any> {
  const timeout = 5000; // 5 second timeout

  // Create isolated function
  const wrappedCode = `
    ${code}

    // Call the main function (assume it's the last function defined)
    const functions = Object.keys(globalThis).filter(k => typeof globalThis[k] === 'function');
    const mainFunction = globalThis[functions[functions.length - 1]];

    return mainFunction(input);
  `;

  // Execute with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const fn = new Function('input', wrappedCode);
    const result = await Promise.race([
      fn(input),
      new Promise((_, reject) => {
        controller.signal.addEventListener('abort', () => {
          reject(new Error('Execution timeout (5s)'));
        });
      })
    ]);

    clearTimeout(timeoutId);
    return result;

  } catch (error) {
    clearTimeout(timeoutId);
    throw new Error(`Execution failed: ${error.message}`);
  }
}

// JSON Schema validation
function validateInput(input: any, schema: any): { valid: boolean; errors: string[] } {
  // Use a JSON Schema validator library or implement basic validation
  // For MVP, can use simple type checking

  const errors: string[] = [];

  if (schema.type === 'object' && schema.properties) {
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      if (schema.required?.includes(key) && !(key in input)) {
        errors.push(`Missing required field: ${key}`);
      }

      // Type checking
      if (key in input) {
        const expectedType = (propSchema as any).type;
        const actualType = typeof input[key];

        if (expectedType === 'number' && actualType !== 'number') {
          errors.push(`${key} must be a number`);
        }
        if (expectedType === 'string' && actualType !== 'string') {
          errors.push(`${key} must be a string`);
        }
        // ... more type checks
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

function validateOutput(output: any, schema: any): { valid: boolean; errors: string[] } {
  // Similar to validateInput
  return validateInput(output, schema);
}
```

### **Function 3: Update advisor-chat to Support Skills**

**File:** `supabase/functions/advisor-chat/index.ts`

```typescript
// Add to existing advisor-chat function

// After detecting user wants skill generation
if (detectSkillGenerationRequest(userMessage)) {
  // Call skill-generator
  const skillGenResponse = await fetch(`${SUPABASE_URL}/functions/v1/skill-generator`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      advisorId,
      skillDescription: extractSkillDescription(userMessage),
      context: getConversationContext(conversationId)
    })
  });

  const { skill } = await skillGenResponse.json();

  // Return skill for user approval
  return new Response(
    JSON.stringify({
      type: 'skill_generated',
      skill,
      message: `I've created a skill: ${skill.name}. Please review and approve it.`
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

// After user approves skill and wants to use it
if (userApprovedSkill) {
  // Execute skill
  const execResponse = await fetch(`${SUPABASE_URL}/functions/v1/skill-executor`, {
    method: 'POST',
    body: JSON.stringify({
      skillId: skill.id,
      input: extractSkillInput(userMessage),
      userId,
      conversationId
    })
  });

  const { success, output, error } = await execResponse.json();

  if (success) {
    // Continue conversation with skill output
    // Send output to LLM for commentary
  }
}

function detectSkillGenerationRequest(message: string): boolean {
  const patterns = [
    /create a (skill|tool|calculator|analyzer)/i,
    /can you (make|build|generate) a/i,
    /I need a (tool|function|helper) (for|to)/i
  ];
  return patterns.some(p => p.test(message));
}
```

---

## Frontend Components

### **Component 1: Skill Approval Modal**

**File:** `src/components/skills/SkillApprovalModal.tsx`

```typescript
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';

interface SkillApprovalModalProps {
  skill: SkillDefinition;
  open: boolean;
  onApprove: () => void;
  onReject: () => void;
}

export function SkillApprovalModal({ skill, open, onApprove, onReject }: SkillApprovalModalProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const highlightedCode = Prism.highlight(
    skill.code,
    Prism.languages.javascript,
    'javascript'
  );

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onReject()}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            New Skill: {skill.name}
            <Badge variant="outline">{skill.category}</Badge>
          </DialogTitle>
          <DialogDescription>
            Review the generated skill before approving
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
            <TabsTrigger value="schema">Schema</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px] mt-4">
            <TabsContent value="overview" className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{skill.description}</p>
              </div>

              {skill.mentalModel && (
                <div>
                  <h4 className="font-semibold mb-2">Mental Model</h4>
                  <p className="text-sm text-muted-foreground">{skill.mentalModel}</p>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-2">Use Cases</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {skill.useCases.map((useCase, i) => (
                    <li key={i}>{useCase}</li>
                  ))}
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="code">
              <div className="bg-zinc-950 rounded-lg p-4">
                <pre className="text-sm">
                  <code
                    className="language-javascript"
                    dangerouslySetInnerHTML={{ __html: highlightedCode }}
                  />
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="schema" className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Input Schema</h4>
                <pre className="bg-muted p-3 rounded text-xs overflow-auto">
                  {JSON.stringify(skill.inputSchema, null, 2)}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Output Schema</h4>
                <pre className="bg-muted p-3 rounded text-xs overflow-auto">
                  {JSON.stringify(skill.outputSchema, null, 2)}
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="examples" className="space-y-4">
              {skill.examples.map((example, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Example {i + 1}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{example.explanation}</p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold mb-1">Input:</p>
                      <pre className="bg-muted p-2 rounded text-xs">
                        {JSON.stringify(example.input, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <p className="text-xs font-semibold mb-1">Output:</p>
                      <pre className="bg-muted p-2 rounded text-xs">
                        {JSON.stringify(example.output, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onReject}>
            Reject
          </Button>
          <Button onClick={onApprove}>
            Approve & Activate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### **Component 2: Skill Library Viewer**

**File:** `src/components/skills/SkillLibrary.tsx`

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function SkillLibrary({ advisorId }: { advisorId?: string }) {
  const { data: skills, isLoading } = useQuery({
    queryKey: ['advisor-skills', advisorId],
    queryFn: async () => {
      const query = supabase
        .from('advisor_skills')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (advisorId) {
        query.eq('advisor_id', advisorId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SkillDefinition[];
    }
  });

  if (isLoading) return <div>Loading skills...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {skills?.map(skill => (
        <Card key={skill.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{skill.name}</CardTitle>
                <CardDescription className="text-sm mt-1">
                  {skill.description}
                </CardDescription>
              </div>
              <Badge variant="outline">{skill.category}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {skill.mentalModel && (
                <p className="text-muted-foreground">
                  <span className="font-semibold">Framework:</span> {skill.mentalModel}
                </p>
              )}
              <p className="text-muted-foreground">
                <span className="font-semibold">Used:</span> {skill.timesUsed} times
              </p>
              <p className="text-xs text-muted-foreground">
                Created {new Date(skill.createdAt).toLocaleDateString()}
              </p>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4">
              View Details
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

### **Component 3: Integration in Chat**

Update existing chat components to handle skill generation:

```typescript
// In ChatInterface.tsx or PersonaChatInterface.tsx

const [pendingSkill, setPendingSkill] = useState<SkillDefinition | null>(null);
const [showSkillApproval, setShowSkillApproval] = useState(false);

// When receiving skill generation response
if (response.type === 'skill_generated') {
  setPendingSkill(response.skill);
  setShowSkillApproval(true);
}

// Approval handler
const handleSkillApprove = async () => {
  // Save to database
  const { error } = await supabase.from('advisor_skills').insert({
    ...pendingSkill,
    user_id: user.id,
    status: 'approved',
    approved_at: new Date()
  });

  if (!error) {
    toast.success('Skill approved and activated!');
    setShowSkillApproval(false);

    // Continue conversation using the skill
    // ...
  }
};

// Render modal
<SkillApprovalModal
  skill={pendingSkill}
  open={showSkillApproval}
  onApprove={handleSkillApprove}
  onReject={() => {
    setShowSkillApproval(false);
    setPendingSkill(null);
  }}
/>
```

---

## Implementation Phases

### **Phase 2.1: Core Infrastructure (Week 1)**
- [ ] Create database tables (advisor_skills, skill_executions)
- [ ] Set up Edge Functions (skill-generator, skill-executor)
- [ ] Implement structured output integration with Anthropic
- [ ] Build sandbox execution environment
- [ ] Write TypeScript interfaces

### **Phase 2.2: Skill Generation (Week 2)**
- [ ] Implement skill generation logic per advisor
- [ ] Add skill detection in advisor-chat
- [ ] Build Skill Approval Modal UI
- [ ] Integrate code syntax highlighting (Prism.js)
- [ ] Add skill saving to database

### **Phase 2.3: Skill Execution (Week 3)**
- [ ] Implement skill executor with validation
- [ ] Add execution logging
- [ ] Build error handling & timeout
- [ ] Create skill invocation in chat
- [ ] Test with various skill types

### **Phase 2.4: Skill Library (Week 4)**
- [ ] Build Skill Library viewer
- [ ] Add skill search & filtering
- [ ] Implement skill versioning
- [ ] Add skill sharing (optional)
- [ ] Create skill analytics dashboard

### **Phase 2.5: Polish & Security (Week 5)**
- [ ] Security audit of code execution
- [ ] Add rate limiting (max skills per day)
- [ ] Improve error messages
- [ ] Add skill editing
- [ ] Write documentation

---

## Security Measures

### **1. Code Execution Sandbox**
- ✅ 5-second timeout
- ✅ No access to file system
- ✅ No network access
- ✅ No access to process/environment
- ✅ Memory limits
- ✅ CPU limits

### **2. Input/Output Validation**
- ✅ Strict JSON schema validation
- ✅ Type checking
- ✅ Size limits (input < 10KB, output < 100KB)
- ✅ No code injection via input

### **3. Rate Limiting**
- Max 5 skill generations per day per user
- Max 100 skill executions per day per user
- Max 10 active skills per advisor

### **4. User Controls**
- User must explicitly approve all generated code
- User can view code before approval
- User can delete skills anytime
- User can disable skill execution

### **5. Monitoring**
- Log all skill executions
- Alert on execution failures
- Track execution times
- Monitor for abuse

---

## Example Skills Each Advisor Might Create

### **Warren Buffett**
1. DCF Calculator
2. Margin of Safety Calculator
3. ROE/ROI Analyzer
4. Economic Moat Evaluator
5. Intrinsic Value Estimator

### **Steve Jobs**
1. Feature Priority Matrix (focus)
2. Design Simplicity Score
3. User Experience Audit
4. Innovation vs Iteration Classifier
5. Product Differentiation Analyzer

### **Ray Dalio**
1. Pain + Reflection = Progress Logger
2. Principles Generator
3. Decision Weight Calculator
4. Radical Transparency Scorer
5. Correlation Matrix Builder

### **Elon Musk**
1. First Principles Breakdown
2. 10x Improvement Calculator
3. Physics-Based Cost Estimator
4. Innovation Difficulty Score
5. Moonshot Feasibility Analyzer

### **Charlie Munger**
1. Inversion Analysis Tool
2. Mental Models Checker
3. Bias Detector
4. Second-Order Effects Mapper
5. Lollapalooza Identifier

---

## Testing Strategy

### **Unit Tests**
- Schema validation functions
- Code execution sandbox
- Input/output validation

### **Integration Tests**
- Skill generation flow
- Skill execution flow
- Database operations
- Edge function calls

### **User Acceptance Tests**
- User requests skill → approves → uses
- User requests skill → rejects
- User reuses previously created skill
- Error handling (bad code, timeout, etc.)

### **Security Tests**
- Attempt code injection
- Attempt to access file system
- Attempt infinite loops
- Attempt memory exhaustion

---

## Success Metrics

### **Adoption Metrics**
- % of users who create at least 1 skill
- Average skills per active user
- Skills approved vs rejected ratio

### **Usage Metrics**
- Skill executions per day
- Average execution time
- Success rate (%)
- Most popular skill categories

### **Quality Metrics**
- User satisfaction with generated skills
- Code review time (how long to approve)
- Skill reuse rate
- Execution errors per 100 runs

**Targets:**
- 30% of users create at least 1 skill (within 30 days)
- 95%+ skill execution success rate
- <10% skill rejection rate
- Average 2 minutes code review time

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Malicious code generated** | Critical | Sandbox, user approval, no external access |
| **Slow execution** | Medium | 5s timeout, monitoring |
| **LLM generates broken code** | Medium | Validation, testing, user can regenerate |
| **Users abuse skill generation** | Low | Rate limiting (5/day) |
| **Storage costs** | Low | Limit active skills to 10 per advisor |

---

## Future Enhancements (Phase 3+)

1. **Skill Marketplace**: Share skills with community
2. **Skill Templates**: Pre-built templates for common needs
3. **Skill Chaining**: Combine multiple skills in workflows
4. **Version Control**: Track skill versions, rollback
5. **Collaborative Skills**: Multiple users contribute to skill
6. **Skill Testing**: Built-in test runner
7. **Visual Skill Builder**: Drag-drop skill creator
8. **Skill Analytics**: Deep insights into skill usage

---

## Deliverables

### **Code**
- 3 new Edge Functions (skill-generator, skill-executor, updates to advisor-chat)
- 2 new DB tables (advisor_skills, skill_executions)
- 3 new React components (SkillApprovalModal, SkillLibrary, skill UI updates)
- TypeScript interfaces for skill system

### **Documentation**
- User guide: "How to create skills with advisors"
- Developer guide: "Skill system architecture"
- Security documentation
- API documentation for Edge Functions

### **Examples**
- 5 pre-built skills per advisor (total: 30 skills)
- Demo videos showing skill creation flow
- Code examples for common skill patterns

---

## Next Steps

**Week 1: Foundation**
1. Create database schema
2. Set up Edge Functions skeleton
3. Integrate Anthropic Structured Outputs
4. Build basic UI components

**Week 2-3: Core Features**
1. Implement skill generation
2. Build approval flow
3. Create execution environment
4. Test with real examples

**Week 4-5: Polish**
1. Add Skill Library
2. Security hardening
3. Performance optimization
4. User testing & feedback

---

**Ready to start building! Phase 2 gives you maximum flexibility with user control and security. Should we begin with Week 1 tasks?**
