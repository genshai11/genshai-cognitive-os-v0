/**
 * Skill Discovery - Context Injection
 * Provides AI advisors with knowledge of available skills
 */

import { createClient } from '@supabase/supabase-js';
import type { SkillDefinition } from '@/types/skills';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Get skill context for advisor system prompt
 */
export async function getSkillContext(
    userId: string,
    advisorId: string
): Promise<string> {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch user's approved skills for this advisor
    const { data: skills, error } = await supabase
        .from('advisor_skills')
        .select('*')
        .eq('user_id', userId)
        .eq('advisor_id', advisorId)
        .eq('status', 'approved')
        .order('times_used', { ascending: false })
        .limit(10); // Top 10 most used

    if (error || !skills || skills.length === 0) {
        return '';
    }

    return `
## YOUR AVAILABLE SKILLS

You have access to ${skills.length} custom skill${skills.length > 1 ? 's' : ''} that you previously created for this user:

${skills.map((s, i) => formatSkillForPrompt(s, i + 1)).join('\n\n')}

**How to use skills:**

1. **When to offer:** If the user's question matches a skill's use case, offer to use it
2. **How to offer:** Example: "I can use my **${skills[0].skill_name}** skill to ${skills[0].description.toLowerCase()}"
3. **Execution syntax:** To execute a skill, respond with:

\`\`\`skill-execute
{
  "skillId": "SKILL_UUID_HERE",
  "skillName": "Skill Name",
  "input": {
    // Input matching the skill's input schema
  }
}
\`\`\`

4. **Creating new skills:** If no existing skill fits, you can offer to create a new one by explaining what it would do

**Important:** Always validate that your input matches the skill's input schema before execution.
`;
}

/**
 * Format a single skill for the prompt
 */
function formatSkillForPrompt(skill: any, index: number): string {
    const inputProps = skill.input_schema?.properties
        ? Object.keys(skill.input_schema.properties).join(', ')
        : 'N/A';

    const outputProps = skill.output_schema?.properties
        ? Object.keys(skill.output_schema.properties).join(', ')
        : 'N/A';

    return `### ${index}. ${skill.skill_name} (\`${skill.id}\`)

**Description:** ${skill.description}

**Category:** ${skill.category}

${skill.mental_model ? `**Mental Model:** ${skill.mental_model}\n` : ''}
**Used:** ${skill.times_used} time${skill.times_used !== 1 ? 's' : ''}

**Input:** ${inputProps}
**Output:** ${outputProps}

**Use when:** ${skill.use_cases.join(', ')}`;
}

/**
 * Get all skills for a user (for Skills Library)
 */
export async function getUserSkills(
    userId: string,
    filters?: {
        advisorId?: string;
        category?: string;
        status?: string;
        search?: string;
    }
): Promise<SkillDefinition[]> {
    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase
        .from('advisor_skills')
        .select('*')
        .eq('user_id', userId);

    if (filters?.advisorId) {
        query = query.eq('advisor_id', filters.advisorId);
    }

    if (filters?.category) {
        query = query.eq('category', filters.category);
    }

    if (filters?.status) {
        query = query.eq('status', filters.status);
    }

    if (filters?.search) {
        query = query.or(`skill_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching skills:', error);
        return [];
    }

    return data || [];
}

/**
 * Get skill statistics for a user
 */
export async function getSkillStats(userId: string): Promise<{
    totalSkills: number;
    approvedSkills: number;
    totalExecutions: number;
    avgExecutionTimeMs: number;
    successRate: number;
}> {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase.rpc('get_skill_stats', {
        p_user_id: userId
    });

    if (error || !data || data.length === 0) {
        return {
            totalSkills: 0,
            approvedSkills: 0,
            totalExecutions: 0,
            avgExecutionTimeMs: 0,
            successRate: 0
        };
    }

    return data[0];
}

/**
 * Approve a skill
 */
export async function approveSkill(skillId: string): Promise<void> {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
        .from('advisor_skills')
        .update({
            status: 'approved',
            approved_at: new Date().toISOString()
        })
        .eq('id', skillId);

    if (error) {
        throw new Error(`Failed to approve skill: ${error.message}`);
    }
}

/**
 * Reject a skill
 */
export async function rejectSkill(skillId: string): Promise<void> {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
        .from('advisor_skills')
        .update({
            status: 'rejected'
        })
        .eq('id', skillId);

    if (error) {
        throw new Error(`Failed to reject skill: ${error.message}`);
    }
}

/**
 * Execute a skill
 */
export async function executeSkill(
    skillId: string,
    input: any,
    conversationId?: string
): Promise<any> {
    const response = await fetch(
        `${supabaseUrl}/functions/v1/skill-executor`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({
                skillId,
                input,
                conversationId
            })
        }
    );

    const result = await response.json();

    if (!result.success) {
        throw new Error(result.error || 'Skill execution failed');
    }

    return result;
}
