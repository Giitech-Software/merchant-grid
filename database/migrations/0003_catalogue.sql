create table product_categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  business_id uuid not null,
  name text not null,
  slug text not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (tenant_id, business_id) references businesses(tenant_id, id),
  unique (business_id, slug),
  unique (tenant_id, id)
);

create table products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  business_id uuid not null,
  category_id uuid,
  sku text not null,
  name text not null,
  description text,
  brand text,
  tax_category text,
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (tenant_id, business_id) references businesses(tenant_id, id),
  foreign key (tenant_id, category_id) references product_categories(tenant_id, id),
  unique (business_id, sku),
  unique (tenant_id, id)
);

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  business_id uuid not null,
  product_id uuid not null,
  name text not null,
  sku text not null,
  retail_price numeric(19,4) not null default 0 check (retail_price >= 0),
  wholesale_price numeric(19,4) check (wholesale_price >= 0),
  buying_cost numeric(19,4) check (buying_cost >= 0),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (tenant_id, business_id) references businesses(tenant_id, id),
  foreign key (tenant_id, product_id) references products(tenant_id, id),
  unique (business_id, sku),
  unique (tenant_id, id)
);

create table product_barcodes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  business_id uuid not null,
  variant_id uuid not null references product_variants(id),
  barcode text not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  foreign key (tenant_id, business_id) references businesses(tenant_id, id),
  unique (business_id, barcode)
);

create index products_business_name_idx on products (business_id, name);
create index product_variants_product_idx on product_variants (product_id);
create index product_barcodes_lookup_idx on product_barcodes (business_id, barcode);
