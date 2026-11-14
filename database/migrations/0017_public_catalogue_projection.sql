create table public_catalogue_products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  business_id uuid not null,
  variant_id uuid not null,
  public_name text not null,
  public_description text,
  public_category text,
  public_price numeric(19,4),
  stock_display_mode text not null default 'hidden' check (stock_display_mode in ('exact', 'available', 'hidden')),
  published_stock numeric(19,6),
  is_featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published', 'unpublished')),
  published_at timestamptz,
  updated_at timestamptz not null default now(),
  foreign key (tenant_id, business_id) references businesses(tenant_id, id),
  foreign key (tenant_id, variant_id) references product_variants(tenant_id, id),
  unique (business_id, variant_id)
);

create index public_catalogue_published_idx on public_catalogue_products (business_id, status, is_featured);
