create table stock_counts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  business_id uuid not null,
  location_id uuid not null,
  status text not null default 'draft' check (status in ('draft', 'counted', 'approved', 'reconciled', 'cancelled')),
  counted_by uuid references users(id),
  approved_by uuid references users(id),
  created_at timestamptz not null default now(),
  counted_at timestamptz,
  approved_at timestamptz,
  reconciled_at timestamptz,
  foreign key (tenant_id, business_id) references businesses(tenant_id, id),
  foreign key (tenant_id, location_id) references locations(tenant_id, id)
);

create table stock_count_items (
  id uuid primary key default gen_random_uuid(),
  count_id uuid not null references stock_counts(id) on delete cascade,
  tenant_id uuid not null,
  variant_id uuid not null,
  system_quantity numeric(19,6) not null,
  counted_quantity numeric(19,6) not null check (counted_quantity >= 0),
  variance numeric(19,6) generated always as (counted_quantity - system_quantity) stored,
  reason text,
  foreign key (tenant_id, variant_id) references product_variants(tenant_id, id),
  unique (count_id, variant_id)
);

create index stock_counts_scope_idx on stock_counts (tenant_id, business_id, location_id, created_at desc);
