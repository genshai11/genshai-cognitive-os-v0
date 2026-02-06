
-- Add communication preference columns to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN formality_level text DEFAULT 'professional',
ADD COLUMN language_complexity text DEFAULT 'moderate',
ADD COLUMN emoji_usage text DEFAULT 'minimal';
