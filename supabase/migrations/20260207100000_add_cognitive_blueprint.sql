-- Add cognitive_blueprint JSONB column to all advisor tables
-- This stores the structured "brain" of each advisor:
-- worldview, diagnostic_pattern, reasoning_chain, emotional_stance, anti_patterns, language_dna

ALTER TABLE custom_personas ADD COLUMN IF NOT EXISTS cognitive_blueprint JSONB;
ALTER TABLE custom_frameworks ADD COLUMN IF NOT EXISTS cognitive_blueprint JSONB;
ALTER TABLE custom_books ADD COLUMN IF NOT EXISTS cognitive_blueprint JSONB;

-- Add metadata column to messages for thinking phases and tool calls
ALTER TABLE messages ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
