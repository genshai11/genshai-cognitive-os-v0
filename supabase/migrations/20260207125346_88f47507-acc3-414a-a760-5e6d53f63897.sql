-- Add cognitive_blueprint column to all three advisor tables
ALTER TABLE public.custom_frameworks ADD COLUMN IF NOT EXISTS cognitive_blueprint jsonb DEFAULT NULL;
ALTER TABLE public.custom_books ADD COLUMN IF NOT EXISTS cognitive_blueprint jsonb DEFAULT NULL;
ALTER TABLE public.custom_personas ADD COLUMN IF NOT EXISTS cognitive_blueprint jsonb DEFAULT NULL;