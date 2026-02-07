-- Migration: Add admin AI provider settings
-- Created: 2026-02-07
-- Purpose: Support admin-level AI provider configuration (Lovable/CLIProxyAPI/Direct)

-- Create admin_ai_settings table
create table if not exists public.admin_ai_settings (
  id uuid primary key default '00000000-0000-0000-0000-000000000001',
  
  -- Provider selection
  provider_type text not null default 'lovable',
  -- Options: 'lovable' | 'cliproxy' | 'direct'
  
  -- CLIProxyAPI configuration (used when provider_type = 'cliproxy')
  cliproxy_url text,
  cliproxy_enabled boolean default false,
  
  -- Direct API configuration (used when provider_type = 'direct')
  -- Phase 2: Will add API key columns later
  
  -- Model preferences
  default_chat_model text default 'gemini-2.0-flash-exp',
  default_image_model text,
  
  -- Metadata
  updated_by uuid references auth.users(id),
  updated_at timestamptz default now(),
  
  -- Ensure only one row exists
  constraint single_row_check check (id = '00000000-0000-0000-0000-000000000001'),
  
  -- Validate provider_type
  constraint valid_provider_type check (provider_type in ('lovable', 'cliproxy', 'direct'))
);

-- Add comment
comment on table public.admin_ai_settings is 
  'Admin-level AI provider configuration. Only one row allowed (singleton pattern).';

comment on column public.admin_ai_settings.provider_type is 
  'AI provider type: lovable (Lovable Cloud), cliproxy (CLIProxyAPI), direct (Direct API keys)';

comment on column public.admin_ai_settings.cliproxy_url is 
  'CLIProxyAPI server URL (e.g., http://your-server.com:8080)';

-- Insert default row (Lovable Cloud as default)
insert into public.admin_ai_settings (
  id,
  provider_type,
  cliproxy_enabled,
  default_chat_model
)
values (
  '00000000-0000-0000-0000-000000000001',
  'lovable',
  false,
  'gemini-2.0-flash-exp'
)
on conflict (id) do nothing;

-- Enable RLS
alter table public.admin_ai_settings enable row level security;

-- RLS Policy: Anyone can view (needed for edge functions)
create policy "Anyone can view admin AI settings"
  on public.admin_ai_settings
  for select
  using (true);

-- RLS Policy: Only admins can update
create policy "Only admins can update AI settings"
  on public.admin_ai_settings
  for update
  using (
    exists (
      select 1 from public.user_profiles
      where user_id = auth.uid()
      and role = 'admin'
    )
  );

-- Add trigger for updated_at
create or replace function public.update_admin_ai_settings_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  return new;
end;
$$ language plpgsql security definer;

create trigger update_admin_ai_settings_timestamp
  before update on public.admin_ai_settings
  for each row
  execute function public.update_admin_ai_settings_updated_at();

-- Grant permissions
grant select on public.admin_ai_settings to authenticated;
grant update on public.admin_ai_settings to authenticated;
