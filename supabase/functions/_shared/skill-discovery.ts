/**
 * Skill Discovery - Deno-compatible version for Edge Functions
 * Provides AI advisors with knowledge of available skills
 */

import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

/**
 * Get skill context for advisor system prompt
 */
export async function getSkillContext(
    supabase: SupabaseClient,
    userId: string,
    advisorId: string
): Promise<string> {
    try {
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

${skills.map((s: any, i: number) => formatSkillForPrompt(s, i + 1)).join('\n\n')}

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
    } catch (error) {
        console.error('Error fetching skill context:', error);
        return '';
    }
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
