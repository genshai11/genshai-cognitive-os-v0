/**
 * TypeScript interfaces for AI-generated skills system
 * @module types/skills
 */

// ============================================================================
// CORE INTERFACES
// ============================================================================

export interface SkillDefinition {
    id: string; // UUID from database
    skillId: string; // kebab-case ID (e.g., "dcf-calculator")
    userId: string;
    advisorId: string;

    // Metadata
    skillName: string;
    description: string;
    category: SkillCategory;
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
    status: SkillStatus;
    approvedAt?: Date;

    // Usage
    timesUsed: number;
    lastUsedAt?: Date;

    // Versioning
    activeVersion: string;
    versionHistory: string[];

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}

export type SkillCategory =
    | 'analysis'
    | 'calculation'
    | 'research'
    | 'creative'
    | 'communication';

export type SkillStatus =
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'archived';

export interface SkillExample {
    input: Record<string, any>;
    output: any;
    explanation: string;
}

// ============================================================================
// JSON SCHEMA
// ============================================================================

export interface JSONSchema {
    type: string;
    properties?: Record<string, JSONSchemaProperty>;
    required?: string[];
    items?: JSONSchema;
    enum?: any[];
    additionalProperties?: boolean;
    description?: string;
}

export interface JSONSchemaProperty {
    type: string;
    description?: string;
    enum?: any[];
    items?: JSONSchema;
    properties?: Record<string, JSONSchemaProperty>;
    required?: string[];
    minimum?: number;
    maximum?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    format?: string;
    default?: any;
}

// ============================================================================
// SKILL EXECUTION
// ============================================================================

export interface SkillExecutionRequest {
    skillId: string; // UUID
    input: Record<string, any>;
    conversationId?: string;
}

export interface SkillExecutionResult {
    success: boolean;
    output?: any;
    error?: string;
    executionTimeMs: number;
    cached?: boolean;
}

export interface SkillExecution {
    id: string;
    skillId: string;
    conversationId?: string;
    userId: string;
    input: Record<string, any>;
    output?: any;
    executionTimeMs: number;
    success: boolean;
    errorMessage?: string;
    cached: boolean;
    executedAt: Date;
}

// ============================================================================
// SKILL GENERATION
// ============================================================================

export interface SkillGenerationRequest {
    conversationId: string;
    advisorId: string;
    skillDescription: string; // What the user wants
    context?: string; // Additional context from conversation
}

export interface SkillGenerationResponse {
    skill: SkillDefinition;
    message: string;
}

// ============================================================================
// SKILL VERSIONING
// ============================================================================

export interface SkillVersion {
    id: string;
    skillId: string;
    version: string;
    code: string;
    inputSchema: JSONSchema;
    outputSchema: JSONSchema;
    changes?: string;
    createdBy: string;
    createdAt: Date;
}

export interface CreateVersionRequest {
    skillId: string;
    newCode: string;
    inputSchema: JSONSchema;
    outputSchema: JSONSchema;
    changes: string;
}

// ============================================================================
// CODE ANALYSIS
// ============================================================================

export interface CodeAnalysis {
    safe: boolean;
    risks: string[];
    warnings: string[];
    complexity: number;
    blockedPatterns?: string[];
}

export interface CodeAnalysisResult extends CodeAnalysis {
    recommendation: 'approve' | 'review' | 'reject';
    message: string;
}

// ============================================================================
// VALIDATION
// ============================================================================

export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

export interface ValidationError {
    field: string;
    message: string;
    value?: any;
}

// ============================================================================
// SKILL LIBRARY
// ============================================================================

export interface SkillLibraryFilters {
    advisorId?: string;
    category?: SkillCategory;
    status?: SkillStatus;
    search?: string;
    sortBy?: 'created_at' | 'times_used' | 'skill_name';
    sortOrder?: 'asc' | 'desc';
}

export interface SkillStats {
    totalSkills: number;
    approvedSkills: number;
    totalExecutions: number;
    avgExecutionTimeMs: number;
    successRate: number;
}

// ============================================================================
// UI STATE
// ============================================================================

export interface SkillApprovalState {
    skill: SkillDefinition | null;
    isOpen: boolean;
    analysis?: CodeAnalysis;
}

export interface SkillExecutionState {
    isExecuting: boolean;
    result?: SkillExecutionResult;
    error?: string;
}

// ============================================================================
// CACHE
// ============================================================================

export interface CacheEntry {
    output: any;
    timestamp: number;
    executionTimeMs: number;
}

export interface CacheStats {
    hits: number;
    misses: number;
    size: number;
    hitRate: number;
}

// ============================================================================
// ADVISOR CONTEXT
// ============================================================================

export interface AdvisorSkillContext {
    advisorId: string;
    skills: SkillDefinition[];
    totalSkills: number;
    mostUsedSkills: SkillDefinition[];
}

// ============================================================================
// DATABASE TYPES (matching Supabase schema)
// ============================================================================

export interface Database {
    public: {
        Tables: {
            advisor_skills: {
                Row: {
                    id: string;
                    user_id: string;
                    advisor_id: string;
                    skill_id: string;
                    skill_name: string;
                    description: string;
                    category: SkillCategory;
                    input_schema: JSONSchema;
                    output_schema: JSONSchema;
                    code: string;
                    language: 'javascript' | 'typescript';
                    mental_model: string | null;
                    use_cases: string[];
                    examples: SkillExample[];
                    status: SkillStatus;
                    approved_at: string | null;
                    times_used: number;
                    last_used_at: string | null;
                    active_version: string;
                    version_history: string[];
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['advisor_skills']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['advisor_skills']['Insert']>;
            };
            skill_versions: {
                Row: {
                    id: string;
                    skill_id: string;
                    version: string;
                    code: string;
                    input_schema: JSONSchema;
                    output_schema: JSONSchema;
                    changes: string | null;
                    created_by: string | null;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['skill_versions']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['skill_versions']['Insert']>;
            };
            skill_executions: {
                Row: {
                    id: string;
                    skill_id: string;
                    conversation_id: string | null;
                    user_id: string;
                    input: Record<string, any>;
                    output: any;
                    execution_time_ms: number | null;
                    success: boolean;
                    error_message: string | null;
                    cached: boolean;
                    executed_at: string;
                };
                Insert: Omit<Database['public']['Tables']['skill_executions']['Row'], 'id' | 'executed_at'>;
                Update: Partial<Database['public']['Tables']['skill_executions']['Insert']>;
            };
        };
        Functions: {
            increment_skill_usage: {
                Args: { p_skill_id: string };
                Returns: void;
            };
            create_skill_version: {
                Args: {
                    p_skill_id: string;
                    p_new_code: string;
                    p_input_schema: JSONSchema;
                    p_output_schema: JSONSchema;
                    p_changes: string;
                };
                Returns: string;
            };
            get_skill_stats: {
                Args: { p_user_id: string };
                Returns: SkillStats[];
            };
        };
    };
}
