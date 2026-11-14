create table suppliers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  business_id uuid not null,
  name text not null,
  phone text,
  email text,
  payment_terms_days integer not null default 0 check (payment_terms_days >= 0),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  foreign key (tenant_id, business_id) references businesses(tenant_id, id),
  unique (tenant_id, id)
);

create table purchase_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  business_id uuid not null,
  supplier_id uuid not null references suppliers(id),
  location_id uuid not null,
  order_number text not null,
  status text not null default 'draft' check (status in ('draft', 'approved', 'partially_received', 'received', 'cancelled')),
  total numeric(19,4) not null default 0,
  created_by uuid references users(id),
  approved_by uuid references users(id),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  foreign key (tenant_id, business_id) references businesses(tenant_id, id),
  foreign key (tenant_id, location_id) references locations(tenant_id, id),
  unique (business_id, order_number),
  unique (tenant_id, id)
);

create table purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references purchase_orders(id),
  tenant_id uuid not null,
  variant_id uuid not null,
  quantity numeric(19,6) not null check (quantity > 0),
  unit_cost numeric(19,4) not null check (unit_cost >= 0),
  received_quantity numeric(19,6) not null default 0 check (received_quantity >= 0),
  foreign key (tenant_id, variant_id) references product_variants(tenant_id, id)
);

create table goods_received_notes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  business_id uuid not null,
  purchase_order_id uuid not null references purchase_orders(id),
  location_id uuid not null,
  received_number text not null,
  status text not null default 'posted' check (status in ('draft', 'posted', 'reversed')),
  received_by uuid references users(id),
  received_at timestamptz not null default now(),
  foreign key (tenant_id, business_id) references businesses(tenant_id, id),
  foreign key (tenant_id, location_id) references locations(tenant_id, id),
  unique (business_id, received_number)
);

create table supplier_invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  business_id uuid not null,
  supplier_id uuid not null references suppliers(id),
  goods_received_id uuid,
  invoice_number text not null,
  total numeric(19,4) not null check (total >= 0),
  amount_paid numeric(19,4) not null default 0,
  balance_due numeric(19,4) not null,
  status text not null default 'open' check (status in ('open', 'partially_paid', 'paid', 'voided')),
  created_at timestamptz not null default now(),
  foreign key (tenant_id, business_id) references businesses(tenant_id, id),
  unique (business_id, invoice_number)
);

create index purchase_orders_scope_idx on purchase_orders (tenant_id, business_id, created_at desc);
create index supplier_invoices_scope_idx on supplier_invoices (tenant_id, business_id, status);
