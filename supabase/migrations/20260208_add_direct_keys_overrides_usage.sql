-- Migration: Add direct API keys, model overrides, and usage tracking
-- Created: 2026-02-08
-- Purpose: Phase 5 - Complete AI provider feature set

-- ============================================================
-- 1. Add direct API key columns to admin_ai_settings
-- ============================================================

-- Encrypted API key storage using pgcrypto
create extension if not exists pgcrypto;

alter table public.admin_ai_settings
  add column if not exists direct_provider text,
  add column if not exists direct_api_key_encrypted text,
  add column if not exists direct_api_url text,
  add column if not exists model_overrides jsonb default '{}'::jsonb;

comment on column public.admin_ai_settings.direct_provider is
  'Direct API provider: openai, anthropic, google, openrouter';

comment on column public.admin_ai_settings.direct_api_key_encrypted is
  'Encrypted API key for direct provider (encrypted with pgcrypto)';

comment on column public.admin_ai_settings.direct_api_url is
  'Custom API base URL for direct provider (e.g., https://openrouter.ai/api/v1)';

comment on column public.admin_ai_settings.model_overrides is
  'Per-function model overrides as JSON: {"generate-advisor": "gemini-2.5-flash-lite", ...}';

-- Add constraint for valid direct_provider
alter table public.admin_ai_settings
  drop constraint if exists valid_direct_provider;

alter table public.admin_ai_settings
  add constraint valid_direct_provider
  check (direct_provider is null or direct_provider in ('openai', 'anthropic', 'google', 'openrouter'));

-- ============================================================
-- 2. Helper functions for API key encryption/decryption
-- ============================================================

-- Encrypt API key (called from admin UI via RPC)
create or replace function public.encrypt_api_key(raw_key text)
returns text as $$
begin
  return encode(
    pgp_sym_encrypt(raw_key, current_setting('app.settings.encryption_key', true)),
    'base64'
  );
end;
$$ language plpgsql security definer;

-- Decrypt API key (called from edge functions via service role)
create or replace function public.decrypt_api_key(encrypted_key text)
returns text as $$
begin
  if encrypted_key is null then return null; end if;
  return pgp_sym_decrypt(
    decode(encrypted_key, 'base64'),
    current_setting('app.settings.encryption_key', true)
  );
end;
$$ language plpgsql security definer;

-- Revoke direct access to these functions from public
revoke execute on function public.encrypt_api_key(text) from public;
revoke execute on function public.decrypt_api_key(text) from public;
grant execute on function public.encrypt_api_key(text) to authenticated;
grant execute on function public.decrypt_api_key(text) to service_role;

-- ============================================================
-- 3. Usage tracking table
-- ============================================================

create table if not exists public.ai_provider_usage (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),

  -- What was called
  function_name text not null,
  provider text not null,
  model text not null,

  -- Performance
  latency_ms integer,
  status_code integer,

  -- Token usage (when available from response)
  prompt_tokens integer,
  completion_tokens integer,
  total_tokens integer,

  -- Cost tracking (optional, for direct API keys)
  estimated_cost_usd numeric(10, 6),

  -- Context
  user_id uuid references auth.users(id),
  was_fallback boolean default false
);

comment on table public.ai_provider_usage is
  'Tracks AI provider usage per request for cost monitoring and debugging';

-- Index for querying usage by date and provider
create index if not exists idx_ai_usage_created_at
  on public.ai_provider_usage(created_at desc);

create index if not exists idx_ai_usage_provider
  on public.ai_provider_usage(provider, created_at desc);

create index if not exists idx_ai_usage_function
  on public.ai_provider_usage(function_name, created_at desc);

-- Enable RLS
alter table public.ai_provider_usage enable row level security;

-- Only admins can view usage
create policy "Only admins can view AI usage"
  on public.ai_provider_usage
  for select
  using (
    exists (
      select 1 from public.user_profiles
      where user_id = auth.uid()
      and role = 'admin'
    )
  );

-- Service role can insert (edge functions)
-- (service_role bypasses RLS, so no INSERT policy needed)

-- Grant permissions
grant select on public.ai_provider_usage to authenticated;
grant insert on public.ai_provider_usage to service_role;
