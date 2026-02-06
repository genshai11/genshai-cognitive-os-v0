
-- Add preferred_response_style to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN preferred_response_style text DEFAULT 'balanced';

-- Create index for performance
CREATE INDEX idx_user_profiles_response_style ON public.user_profiles(preferred_response_style);
