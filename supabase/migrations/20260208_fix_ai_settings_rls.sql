-- Migration: Fix admin_ai_settings RLS policies
-- Created: 2026-02-08
-- Purpose: Restrict SELECT to admins only. Edge functions use service_role_key
--          which bypasses RLS, so the open SELECT policy was unnecessarily
--          exposing the CLIProxyAPI URL to all authenticated users.

-- Drop the overly permissive SELECT policy
drop policy if exists "Anyone can view admin AI settings" on public.admin_ai_settings;

-- Create admin-only SELECT policy
create policy "Only admins can view AI settings"
  on public.admin_ai_settings
  for select
  using (
    exists (
      select 1 from public.user_profiles
      where user_id = auth.uid()
      and role = 'admin'
    )
  );
