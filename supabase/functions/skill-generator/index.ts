/**
 * Skill Generator Edge Function
 * Generates AI skills using Anthropic's structured outputs
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3';

const anthropic = new Anthropic({
    apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// JSON Schema for skill definition output
const SKILL_DEFINITION_SCHEMA = {
    type: 'object',
    required: [
        'skillId',
        'skillName',
        'description',
        'category',
        'inputSchema',
        'outputSchema',
        'code',
        'useCases',
        'examples'
    ],
    properties: {
        skillId: {
            type: 'string',
            description: 'Unique kebab-case identifier (e.g., dcf-calculator)'
        },
        skillName: {
            type: 'string',
            description: 'Human-readable name'
        },
        description: {
            type: 'string',
            description: 'What this skill does'
        },
        category: {
            type: 'string',
            enum: ['analysis', 'calculation', 'research', 'creative', 'communication']
        },
        mentalModel: {
            type: 'string',
            description: 'Mental model or framework this skill uses'
        },
        inputSchema: {
            type: 'object',
            description: 'JSON Schema for input validation'
        },
        outputSchema: {
            type: 'object',
            description: 'JSON Schema for output validation'
        },
        code: {
            type: 'string',
            description: 'JavaScript function code (must define executeSkill function)'
        },
        useCases: {
            type: 'array',
            items: { type: 'string' },
            description: 'When to use this skill'
        },
        examples: {
            type: 'array',
            items: {
                type: 'object',
                required: ['input', 'output', 'explanation'],
                properties: {
                    input: { type: 'object' },
                    output: {},
                    explanation: { type: 'string' }
                }
            }
        }
    }
};

const SYSTEM_PROMPT = `You are an expert AI skill generator. Your job is to create custom JavaScript functions based on user requests.

**CRITICAL RULES:**
1. Code must define EXACTLY ONE function named "executeSkill"
2. Function signature: function executeSkill(input) { return output; }
3. NO external dependencies, imports, or requires
4. NO network calls (fetch, XMLHttpRequest, WebSocket)
5. NO file system access
6. NO Deno/Node.js APIs
7. NO eval, Function constructor, or dynamic code execution
8. Use ONLY pure JavaScript: Math, String, Array, Object, Date methods
9. Keep code simple and focused on ONE task
10. Add clear comments explaining the logic

**GOOD EXAMPLE:**
\`\`\`javascript
function executeSkill(input) {
  // DCF Calculator: Discounted Cash Flow valuation
  const { cashFlows, discountRate } = input;
  
  // Calculate NPV
  const npv = cashFlows.reduce((sum, cf, i) => {
    return sum + cf / Math.pow(1 + discountRate, i + 1);
  }, 0);
  
  return {
    intrinsicValue: npv,
    discountRate: discountRate,
    periods: cashFlows.length
  };
}
\`\`\`

**BAD EXAMPLE (DO NOT DO THIS):**
\`\`\`javascript
function executeSkill(input) {
  // ❌ NO network calls
  const response = await fetch('https://api.example.com');
  
  // ❌ NO Deno APIs
  const file = Deno.readTextFileSync('data.json');
  
  // ❌ NO eval or dynamic code
  eval(input.code);
  
  return result;
}
\`\`\`

Generate a skill definition that follows these rules strictly.`;

serve(async (req) => {
    try {
        // CORS headers
        if (req.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
                },
            });
        }

        // Parse request
        const { conversationId, advisorId, skillDescription, context } = await req.json();

        // Get user from auth header
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('Missing authorization header');
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(
            authHeader.replace('Bearer ', '')
        );

        if (authError || !user) {
            throw new Error('Unauthorized');
        }

        // Generate skill using Anthropic structured outputs
        const message = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 4096,
            temperature: 0.7,
            system: SYSTEM_PROMPT,
            messages: [
                {
                    role: 'user',
                    content: `Create a custom skill for the following request:

**User Request:** ${skillDescription}

**Advisor:** ${advisorId}

${context ? `**Context from conversation:**\n${context}` : ''}

Generate a complete skill definition following all the rules.`
                }
            ],
            tools: [
                {
                    name: 'create_skill',
                    description: 'Create a new AI skill definition',
                    input_schema: SKILL_DEFINITION_SCHEMA
                }
            ],
            tool_choice: { type: 'tool', name: 'create_skill' }
        });

        // Extract skill definition from tool use
        const toolUse = message.content.find((block: any) => block.type === 'tool_use');
        if (!toolUse) {
            throw new Error('Failed to generate skill definition');
        }

        const skillDef = toolUse.input;

        // Save to database with pending status
        const { data: skill, error: insertError } = await supabase
            .from('advisor_skills')
            .insert({
                user_id: user.id,
                advisor_id: advisorId,
                skill_id: skillDef.skillId,
                skill_name: skillDef.skillName,
                description: skillDef.description,
                category: skillDef.category,
                mental_model: skillDef.mentalModel || null,
                input_schema: skillDef.inputSchema,
                output_schema: skillDef.outputSchema,
                code: skillDef.code,
                language: 'javascript',
                use_cases: skillDef.useCases,
                examples: skillDef.examples,
                status: 'pending'
            })
            .select()
            .single();

        if (insertError) {
            throw insertError;
        }

        // Return skill for approval
        return new Response(
            JSON.stringify({
                success: true,
                skill,
                message: 'Skill generated successfully. Please review and approve.'
            }),
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
        );

    } catch (error) {
        console.error('Skill generation error:', error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
        );
    }
});
