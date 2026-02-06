
-- Create response style analytics table
CREATE TABLE public.response_style_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  detected_style text NOT NULL,
  confidence_score numeric(3,2) NOT NULL,
  current_preference text,
  final_style_used text,
  message_count integer NOT NULL,
  was_auto_updated boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.response_style_analytics ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own analytics"
ON public.response_style_analytics
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert analytics"
ON public.response_style_analytics
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all analytics"
ON public.response_style_analytics
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for querying by user
CREATE INDEX idx_style_analytics_user ON public.response_style_analytics(user_id, created_at DESC);

-- Add adaptive_style_enabled to user_profiles for A/B testing
ALTER TABLE public.user_profiles
ADD COLUMN adaptive_style_enabled boolean DEFAULT (random() < 0.5);
