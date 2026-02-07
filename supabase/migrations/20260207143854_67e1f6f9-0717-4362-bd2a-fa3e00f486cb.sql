
-- Create admin_ai_settings table (singleton config row)
CREATE TABLE IF NOT EXISTS public.admin_ai_settings (
    id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' PRIMARY KEY,
    provider_type TEXT NOT NULL DEFAULT 'lovable',
    cliproxy_url TEXT,
    cliproxy_enabled BOOLEAN NOT NULL DEFAULT false,
    default_chat_model TEXT DEFAULT 'gemini-2.0-flash-exp',
    default_image_model TEXT,
    direct_provider TEXT,
    direct_api_key_encrypted TEXT,
    direct_api_url TEXT,
    model_overrides JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_ai_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write
CREATE POLICY "Admins can view AI settings"
ON public.admin_ai_settings FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update AI settings"
ON public.admin_ai_settings FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Service role needs access from edge functions
CREATE POLICY "Service role can read AI settings"
ON public.admin_ai_settings FOR SELECT
USING (true);

-- Insert default row
INSERT INTO public.admin_ai_settings (id) 
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Trigger for updated_at
CREATE TRIGGER update_admin_ai_settings_updated_at
BEFORE UPDATE ON public.admin_ai_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Encrypt/decrypt functions using pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.encrypt_api_key(raw_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    encryption_key TEXT;
BEGIN
    encryption_key := current_setting('app.settings.jwt_secret', true);
    IF encryption_key IS NULL OR encryption_key = '' THEN
        encryption_key := 'genshai-default-enc-key-change-me';
    END IF;
    RETURN encode(encrypt(raw_key::bytea, encryption_key::bytea, 'aes'), 'base64');
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_api_key(encrypted_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    encryption_key TEXT;
BEGIN
    encryption_key := current_setting('app.settings.jwt_secret', true);
    IF encryption_key IS NULL OR encryption_key = '' THEN
        encryption_key := 'genshai-default-enc-key-change-me';
    END IF;
    RETURN convert_from(decrypt(decode(encrypted_key, 'base64'), encryption_key::bytea, 'aes'), 'utf8');
END;
$$;

-- AI provider usage tracking table
CREATE TABLE IF NOT EXISTS public.ai_provider_usage (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    function_name TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    status_code INTEGER,
    latency_ms INTEGER,
    was_fallback BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on usage table
ALTER TABLE public.ai_provider_usage ENABLE ROW LEVEL SECURITY;

-- Service role can insert (from edge functions)
CREATE POLICY "Service role can insert usage"
ON public.ai_provider_usage FOR INSERT
WITH CHECK (true);

-- Admins can view usage
CREATE POLICY "Admins can view usage"
ON public.ai_provider_usage FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Index for analytics queries
CREATE INDEX idx_ai_provider_usage_created_at ON public.ai_provider_usage (created_at DESC);
CREATE INDEX idx_ai_provider_usage_function ON public.ai_provider_usage (function_name, created_at DESC);
