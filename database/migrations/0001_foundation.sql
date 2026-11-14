-- MerchantGrid foundation schema
-- PostgreSQL is authoritative for shared operational transactions.

create extension if not exists pgcrypto;

create table tenants (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  slug text not null unique,
  status text not null default 'active' check (status in ('active', 'suspended', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table businesses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  name text not null,
  slug text not null,
  status text not null default 'active' check (status in ('active', 'suspended', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, slug),
  unique (tenant_id, id)
);

create table locations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  business_id uuid not null,
  name text not null,
  code text not null,
  kind text not null default 'shop' check (kind in ('shop', 'branch', 'warehouse', 'office', 'site')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (tenant_id, business_id) references businesses(tenant_id, id),
  unique (business_id, code),
  unique (tenant_id, id)
);

create table users (
  id uuid primary key default gen_random_uuid(),
  external_subject text,
  email text not null,
  display_name text not null,
  status text not null default 'active' check (status in ('active', 'deactivated', 'locked')),
  mfa_required boolean not null default false,
  last_authenticated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (external_subject)
);

create unique index users_email_ci on users (lower(email));

create table roles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  name text not null,
  description text,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  unique (tenant_id, name),
  unique (tenant_id, id)
);

create table permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text not null
);

create table role_permissions (
  role_id uuid not null references roles(id) on delete cascade,
  permission_id uuid not null references permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  business_id uuid not null,
  user_id uuid not null references users(id),
  role_id uuid not null,
  location_id uuid,
  status text not null default 'active' check (status in ('active', 'suspended', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (tenant_id, business_id) references businesses(tenant_id, id),
  foreign key (tenant_id, role_id) references roles(tenant_id, id),
  foreign key (tenant_id, location_id) references locations(tenant_id, id),
  unique (user_id, business_id, role_id, location_id)
);

create table audit_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  business_id uuid,
  actor_user_id uuid references users(id),
  action text not null,
  target_type text not null,
  target_id uuid,
  reason text,
  before_data jsonb,
  after_data jsonb,
  context jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  foreign key (tenant_id, business_id) references businesses(tenant_id, id)
);

create index businesses_tenant_idx on businesses (tenant_id);
create index locations_business_idx on locations (business_id);
create index memberships_user_idx on memberships (user_id);
create index memberships_scope_idx on memberships (tenant_id, business_id, location_id);
create index audit_events_scope_idx on audit_events (tenant_id, business_id, occurred_at desc);

-- Prevent direct mutation of audit history after insertion.
create or replace function prevent_audit_mutation() returns trigger language plpgsql as $$
begin
  raise exception 'audit_events are append-only';
end;
$$;

create trigger audit_events_no_update before update or delete on audit_events
for each row execute function prevent_audit_mutation();

