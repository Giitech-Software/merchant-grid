create table catalogue_enquiries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  business_id uuid not null,
  name text not null,
  email text,
  phone text,
  message text not null,
  status text not null default 'new' check (status in ('new', 'contacted', 'closed', 'spam')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (tenant_id, business_id) references businesses(tenant_id, id)
);

create index catalogue_enquiries_scope_idx on catalogue_enquiries (business_id, status, created_at desc);
