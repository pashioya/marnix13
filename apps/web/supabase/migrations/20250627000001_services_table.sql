-- Create services table
create table if not exists public.services (
    id uuid primary key default gen_random_uuid(),
    service_key varchar(50) unique not null, -- The unique identifier like 'jellyfin', 'nextcloud'
    name varchar(100) not null,
    description text,
    
    -- Configuration
    url text not null,
    api_key text, -- Should be encrypted in production
    enabled boolean not null default true,
    auto_provision boolean not null default false,
    
    -- Status & Health
    status varchar(20) not null default 'unknown' check (status in ('online', 'offline', 'error', 'unknown')),
    last_health_check timestamp with time zone,
    health_check_interval integer not null default 30 check (health_check_interval between 1 and 1440),
    
    -- Service categorization
    category varchar(50) not null check (category in ('media', 'storage', 'management', 'productivity', 'security', 'monitoring', 'development', 'communication')),
    service_type varchar(50) not null check (service_type in ('jellyfin', 'nextcloud', 'radarr', 'sonarr', 'plex', 'overseerr', 'tautulli', 'portainer', 'homeassistant', 'grafana', 'prometheus', 'custom')),
    
    -- Authentication & Security
    auth_type varchar(20) not null default 'none' check (auth_type in ('api_key', 'basic_auth', 'oauth', 'none')),
    requires_auth boolean not null default false,
    ssl_enabled boolean not null default false,
    
    -- User management
    supports_user_provisioning boolean not null default false,
    user_provisioning_config jsonb,
    default_user_role varchar(100),
    
    -- Metadata
    version varchar(50),
    icon text,
    documentation text,
    tags text[] default '{}',
    
    -- Timestamps & ownership
    account_id uuid not null references public.accounts(id) on delete cascade,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    created_by uuid not null references auth.users(id),
    updated_by uuid not null references auth.users(id)
);

-- Add indexes for better performance
create index if not exists idx_services_account_id on public.services(account_id);
create index if not exists idx_services_service_key on public.services(service_key);
create index if not exists idx_services_enabled on public.services(enabled);
create index if not exists idx_services_status on public.services(status);
create index if not exists idx_services_category on public.services(category);

-- Add RLS policies
alter table public.services enable row level security;

-- Users can only see services from their own accounts
create policy "Users can view services from their accounts" on public.services
    for select using (
        account_id = auth.uid()
    );

-- Users can create services for accounts they belong to
create policy "Users can create services for their accounts" on public.services
    for insert with check (
        account_id = auth.uid()
    );

-- Users can update services for accounts they belong to
create policy "Users can update services for their accounts" on public.services
    for update using (
        account_id = auth.uid()
    );

-- Users can delete services for accounts they belong to
create policy "Users can delete services for their accounts" on public.services
    for delete using (
        account_id = auth.uid()
    );

-- Add trigger to update the updated_at timestamp
create or replace function public.update_services_updated_at()
returns trigger
set search_path = ''
as $$
begin
    new.updated_at = pg_catalog.now();
    return new;
end;
$$ language plpgsql;

create trigger update_services_updated_at_trigger
    before update on public.services
    for each row
    execute function public.update_services_updated_at();

-- Add comments for documentation
comment on table public.services is 'Services configuration and management for accounts';
comment on column public.services.service_key is 'Unique identifier for the service type (e.g., jellyfin, nextcloud)';
comment on column public.services.url is 'The service endpoint URL';
comment on column public.services.api_key is 'API key for service authentication (should be encrypted)';
comment on column public.services.auto_provision is 'Whether to automatically provision user accounts on this service';
comment on column public.services.user_provisioning_config is 'JSON configuration for user provisioning';
comment on column public.services.health_check_interval is 'Health check interval in minutes (1-1440)';
