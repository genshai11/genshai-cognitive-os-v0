
-- Create advisor_skills table
CREATE TABLE public.advisor_skills (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    advisor_id TEXT NOT NULL,
    skill_id TEXT NOT NULL,
    skill_name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('analysis', 'calculation', 'research', 'creative', 'communication')),
    mental_model TEXT,
    input_schema JSONB NOT NULL DEFAULT '{}',
    output_schema JSONB NOT NULL DEFAULT '{}',
    code TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'javascript',
    use_cases TEXT[] NOT NULL DEFAULT '{}',
    examples JSONB NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    times_used INTEGER NOT NULL DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create skill_versions table
CREATE TABLE public.skill_versions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    skill_id UUID NOT NULL REFERENCES public.advisor_skills(id) ON DELETE CASCADE,
    version INTEGER NOT NULL DEFAULT 1,
    code TEXT NOT NULL,
    input_schema JSONB NOT NULL DEFAULT '{}',
    output_schema JSONB NOT NULL DEFAULT '{}',
    change_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create skill_executions table
CREATE TABLE public.skill_executions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    skill_id UUID NOT NULL REFERENCES public.advisor_skills(id) ON DELETE CASCADE,
    conversation_id UUID,
    user_id UUID NOT NULL,
    input JSONB,
    output JSONB,
    execution_time_ms INTEGER,
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    cached BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.advisor_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_executions ENABLE ROW LEVEL SECURITY;

-- RLS policies for advisor_skills
CREATE POLICY "Users can view their own skills"
ON public.advisor_skills FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own skills"
ON public.advisor_skills FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skills"
ON public.advisor_skills FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own skills"
ON public.advisor_skills FOR DELETE
USING (auth.uid() = user_id);

-- Service role insert for edge functions
CREATE POLICY "Service role can insert skills"
ON public.advisor_skills FOR INSERT
WITH CHECK (true);

-- RLS policies for skill_versions
CREATE POLICY "Users can view their skill versions"
ON public.skill_versions FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.advisor_skills
    WHERE advisor_skills.id = skill_versions.skill_id
    AND advisor_skills.user_id = auth.uid()
));

CREATE POLICY "Service role can insert versions"
ON public.skill_versions FOR INSERT
WITH CHECK (true);

-- RLS policies for skill_executions
CREATE POLICY "Users can view their own executions"
ON public.skill_executions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert executions"
ON public.skill_executions FOR INSERT
WITH CHECK (true);

-- Helper function: increment skill usage
CREATE OR REPLACE FUNCTION public.increment_skill_usage(p_skill_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.advisor_skills
    SET times_used = times_used + 1,
        last_used_at = now()
    WHERE id = p_skill_id;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_advisor_skills_updated_at
BEFORE UPDATE ON public.advisor_skills
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_advisor_skills_user_advisor ON public.advisor_skills(user_id, advisor_id);
CREATE INDEX idx_advisor_skills_status ON public.advisor_skills(status);
CREATE INDEX idx_skill_executions_skill_id ON public.skill_executions(skill_id);
CREATE INDEX idx_skill_executions_user_id ON public.skill_executions(user_id);
