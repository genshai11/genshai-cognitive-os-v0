-- Migration: Create Advisor Skills and Skill Versions Tables
-- Date: 2026-02-07
-- Description: Database schema for AI-generated skills with versioning and security

-- ============================================================================
-- 1. ADVISOR SKILLS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS advisor_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  advisor_id TEXT NOT NULL,

  -- Skill identity
  skill_id TEXT NOT NULL, -- e.g., "dcf-calculator"
  skill_name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('analysis', 'calculation', 'research', 'creative', 'communication')),

  -- Schema definitions (for validation)
  input_schema JSONB NOT NULL,
  output_schema JSONB NOT NULL,

  -- Code
  code TEXT NOT NULL,
  language TEXT DEFAULT 'javascript' CHECK (language IN ('javascript', 'typescript')),

  -- Metadata
  mental_model TEXT,
  use_cases TEXT[] DEFAULT '{}',
  examples JSONB DEFAULT '[]', -- Array of {input, output, explanation}

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
  approved_at TIMESTAMPTZ,

  -- Usage tracking
  times_used INT DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  -- Versioning
  active_version TEXT DEFAULT '1.0.0',
  version_history JSONB DEFAULT '[]',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  UNIQUE(user_id, advisor_id, skill_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_advisor_skills_user_id ON advisor_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_advisor_skills_advisor ON advisor_skills(advisor_id);
CREATE INDEX IF NOT EXISTS idx_advisor_skills_status ON advisor_skills(status);
CREATE INDEX IF NOT EXISTS idx_advisor_skills_category ON advisor_skills(category);
CREATE INDEX IF NOT EXISTS idx_advisor_skills_user_advisor ON advisor_skills(user_id, advisor_id);

-- ============================================================================
-- 2. SKILL VERSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS skill_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID REFERENCES advisor_skills(id) ON DELETE CASCADE NOT NULL,

  -- Version details
  version TEXT NOT NULL,
  code TEXT NOT NULL,
  input_schema JSONB NOT NULL,
  output_schema JSONB NOT NULL,

  -- Change tracking
  changes TEXT, -- What changed in this version
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  UNIQUE(skill_id, version)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_skill_versions_skill_id ON skill_versions(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_versions_created_at ON skill_versions(created_at DESC);

-- ============================================================================
-- 3. SKILL EXECUTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS skill_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  skill_id UUID REFERENCES advisor_skills(id) ON DELETE CASCADE NOT NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Execution details
  input JSONB NOT NULL,
  output JSONB,

  -- Performance
  execution_time_ms INT,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  cached BOOLEAN DEFAULT false,

  -- Timestamp
  executed_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_skill_executions_skill_id ON skill_executions(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_executions_user_id ON skill_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_executions_conversation ON skill_executions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_skill_executions_executed_at ON skill_executions(executed_at DESC);

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE advisor_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_executions ENABLE ROW LEVEL SECURITY;

-- advisor_skills policies
CREATE POLICY "Users can view their own skills"
  ON advisor_skills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own skills"
  ON advisor_skills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skills"
  ON advisor_skills FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own skills"
  ON advisor_skills FOR DELETE
  USING (auth.uid() = user_id);

-- skill_versions policies
CREATE POLICY "Users can view versions of their skills"
  ON skill_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM advisor_skills
      WHERE advisor_skills.id = skill_versions.skill_id
      AND advisor_skills.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create versions of their skills"
  ON skill_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM advisor_skills
      WHERE advisor_skills.id = skill_versions.skill_id
      AND advisor_skills.user_id = auth.uid()
    )
  );

-- skill_executions policies
CREATE POLICY "Users can view their own executions"
  ON skill_executions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own executions"
  ON skill_executions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 5. HELPER FUNCTIONS
-- ============================================================================

-- Function to increment skill usage count
CREATE OR REPLACE FUNCTION increment_skill_usage(p_skill_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE advisor_skills
  SET times_used = times_used + 1,
      last_used_at = now()
  WHERE id = p_skill_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a new skill version
CREATE OR REPLACE FUNCTION create_skill_version(
  p_skill_id UUID,
  p_new_code TEXT,
  p_input_schema JSONB,
  p_output_schema JSONB,
  p_changes TEXT
) RETURNS TEXT AS $$
DECLARE
  v_current_version TEXT;
  v_new_version TEXT;
  v_major INT;
  v_minor INT;
  v_patch INT;
BEGIN
  -- Get current version
  SELECT active_version INTO v_current_version
  FROM advisor_skills
  WHERE id = p_skill_id;

  -- Parse version (simple semver: major.minor.patch)
  v_major := split_part(v_current_version, '.', 1)::INT;
  v_minor := split_part(v_current_version, '.', 2)::INT;
  v_patch := split_part(v_current_version, '.', 3)::INT;

  -- Increment patch version
  v_patch := v_patch + 1;
  v_new_version := v_major || '.' || v_minor || '.' || v_patch;

  -- Insert version history
  INSERT INTO skill_versions (
    skill_id,
    version,
    code,
    input_schema,
    output_schema,
    changes,
    created_by
  ) VALUES (
    p_skill_id,
    v_new_version,
    p_new_code,
    p_input_schema,
    p_output_schema,
    p_changes,
    auth.uid()
  );

  -- Update active version
  UPDATE advisor_skills
  SET active_version = v_new_version,
      code = p_new_code,
      input_schema = p_input_schema,
      output_schema = p_output_schema,
      updated_at = now()
  WHERE id = p_skill_id;

  RETURN v_new_version;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get skill statistics
CREATE OR REPLACE FUNCTION get_skill_stats(p_user_id UUID)
RETURNS TABLE (
  total_skills BIGINT,
  approved_skills BIGINT,
  total_executions BIGINT,
  avg_execution_time_ms NUMERIC,
  success_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT s.id) as total_skills,
    COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'approved') as approved_skills,
    COUNT(e.id) as total_executions,
    ROUND(AVG(e.execution_time_ms), 2) as avg_execution_time_ms,
    ROUND(
      COUNT(e.id) FILTER (WHERE e.success = true)::NUMERIC / 
      NULLIF(COUNT(e.id), 0) * 100,
      2
    ) as success_rate
  FROM advisor_skills s
  LEFT JOIN skill_executions e ON e.skill_id = s.id
  WHERE s.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. UPDATE CONVERSATIONS TABLE
-- ============================================================================

-- Add skills_used field to track which skills were used in conversation
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS skills_used JSONB DEFAULT '[]';

-- Add index
CREATE INDEX IF NOT EXISTS idx_conversations_skills_used ON conversations USING GIN (skills_used);

-- ============================================================================
-- 7. TRIGGERS
-- ============================================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_advisor_skills_updated_at
  BEFORE UPDATE ON advisor_skills
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE advisor_skills IS 'AI-generated skills/tools created by persona advisors';
COMMENT ON TABLE skill_versions IS 'Version history for skills';
COMMENT ON TABLE skill_executions IS 'Execution logs for skill usage';
COMMENT ON COLUMN advisor_skills.skill_id IS 'Unique identifier in kebab-case (e.g., dcf-calculator)';
COMMENT ON COLUMN advisor_skills.input_schema IS 'JSON Schema for validating skill inputs';
COMMENT ON COLUMN advisor_skills.output_schema IS 'JSON Schema for validating skill outputs';
COMMENT ON COLUMN advisor_skills.code IS 'JavaScript/TypeScript function code';
COMMENT ON COLUMN skill_executions.cached IS 'Whether this execution result was served from cache';
