create table units (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  business_id uuid not null,
  code text not null,
  name text not null,
  symbol text,
  created_at timestamptz not null default now(),
  foreign key (tenant_id, business_id) references businesses(tenant_id, id),
  unique (business_id, code),
  unique (tenant_id, id)
);

alter table product_variants
  add column base_unit_id uuid,
  add column sales_unit_id uuid,
  add column purchase_unit_id uuid;

alter table product_variants
  add constraint product_variants_base_unit_fk foreign key (tenant_id, base_unit_id) references units(tenant_id, id),
  add constraint product_variants_sales_unit_fk foreign key (tenant_id, sales_unit_id) references units(tenant_id, id),
  add constraint product_variants_purchase_unit_fk foreign key (tenant_id, purchase_unit_id) references units(tenant_id, id);

create table unit_conversions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  business_id uuid not null,
  variant_id uuid not null,
  from_unit_id uuid not null,
  to_unit_id uuid not null,
  multiplier numeric(19,8) not null check (multiplier > 0),
  effective_from timestamptz not null default now(),
  effective_to timestamptz,
  created_at timestamptz not null default now(),
  foreign key (tenant_id, business_id) references businesses(tenant_id, id),
  foreign key (tenant_id, variant_id) references product_variants(tenant_id, id),
  foreign key (tenant_id, from_unit_id) references units(tenant_id, id),
  foreign key (tenant_id, to_unit_id) references units(tenant_id, id),
  check (from_unit_id <> to_unit_id),
  check (effective_to is null or effective_to > effective_from)
);

create index unit_conversions_lookup_idx on unit_conversions (variant_id, from_unit_id, to_unit_id, effective_from desc);
