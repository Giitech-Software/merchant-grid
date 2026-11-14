create table account_mappings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  business_id uuid not null,
  mapping_key text not null,
  account_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (tenant_id, business_id) references businesses(tenant_id, id),
  foreign key (tenant_id, account_id) references chart_of_accounts(tenant_id, id),
  unique (business_id, mapping_key)
);

create index account_mappings_lookup_idx on account_mappings (tenant_id, business_id, mapping_key);
