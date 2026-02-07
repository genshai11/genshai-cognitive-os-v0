/**
 * Skill Discovery - Context Injection
 * Provides AI advisors with knowledge of available skills
 */

import { supabase } from '@/integrations/supabase/client';
import type { SkillDefinition } from '@/types/skills';

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
): Promise<any[]> {
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

    return (data || []).map(mapDbToSkill);
}

/**
 * Get skill statistics for a user
 */
export async function getSkillStats(userId: string) {
    // Get skills count
    const { data: skills } = await supabase
        .from('advisor_skills')
        .select('id, status')
        .eq('user_id', userId);

    const totalSkills = skills?.length || 0;
    const approvedSkills = skills?.filter(s => s.status === 'approved').length || 0;

    // Get executions
    const { data: executions } = await supabase
        .from('skill_executions')
        .select('execution_time_ms, success')
        .eq('user_id', userId);

    const totalExecutions = executions?.length || 0;
    const successCount = executions?.filter(e => e.success).length || 0;
    const avgTime = totalExecutions > 0
        ? (executions?.reduce((sum, e) => sum + (e.execution_time_ms || 0), 0) || 0) / totalExecutions
        : 0;

    return {
        totalSkills,
        approvedSkills,
        totalExecutions,
        avgExecutionTimeMs: avgTime,
        successRate: totalExecutions > 0 ? (successCount / totalExecutions) * 100 : 0
    };
}

/**
 * Approve a skill
 */
export async function approveSkill(skillId: string): Promise<void> {
    const { error } = await supabase
        .from('advisor_skills')
        .update({ status: 'approved' })
        .eq('id', skillId);

    if (error) throw new Error(`Failed to approve skill: ${error.message}`);
}

/**
 * Reject a skill
 */
export async function rejectSkill(skillId: string): Promise<void> {
    const { error } = await supabase
        .from('advisor_skills')
        .update({ status: 'rejected' })
        .eq('id', skillId);

    if (error) throw new Error(`Failed to reject skill: ${error.message}`);
}

/**
 * Execute a skill via edge function
 */
export async function executeSkill(
    skillId: string,
    input: any,
    conversationId?: string
): Promise<any> {
    const { data, error } = await supabase.functions.invoke('skill-executor', {
        body: { skillId, input, conversationId }
    });

    if (error) throw new Error(error.message || 'Skill execution failed');
    if (!data?.success) throw new Error(data?.error || 'Skill execution failed');

    return data;
}

/** Map DB row to SkillDefinition shape */
function mapDbToSkill(row: any): SkillDefinition {
    return {
        id: row.id,
        skillId: row.skill_id,
        userId: row.user_id,
        advisorId: row.advisor_id,
        skillName: row.skill_name,
        description: row.description,
        category: row.category,
        mentalModel: row.mental_model,
        inputSchema: row.input_schema,
        outputSchema: row.output_schema,
        code: row.code,
        language: row.language,
        useCases: row.use_cases || [],
        examples: row.examples || [],
        status: row.status,
        timesUsed: row.times_used || 0,
        lastUsedAt: row.last_used_at,
        activeVersion: '1',
        versionHistory: [],
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };
}
