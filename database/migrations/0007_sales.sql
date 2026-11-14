create table customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  business_id uuid not null,
  name text not null,
  phone text,
  email text,
  credit_limit numeric(19,4) not null default 0 check (credit_limit >= 0),
  payment_terms_days integer not null default 0 check (payment_terms_days >= 0),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (tenant_id, business_id) references businesses(tenant_id, id),
  unique (tenant_id, id)
);

create table sales_invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  business_id uuid not null,
  location_id uuid not null,
  customer_id uuid,
  invoice_number text not null,
  status text not null default 'draft' check (status in ('draft', 'posted', 'voided', 'reversed')),
  subtotal numeric(19,4) not null default 0,
  discount_total numeric(19,4) not null default 0,
  tax_total numeric(19,4) not null default 0,
  total numeric(19,4) not null default 0,
  amount_paid numeric(19,4) not null default 0,
  balance_due numeric(19,4) not null default 0,
  cashier_user_id uuid references users(id),
  posted_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (tenant_id, business_id) references businesses(tenant_id, id),
  foreign key (tenant_id, location_id) references locations(tenant_id, id),
  foreign key (tenant_id, customer_id) references customers(tenant_id, id),
  unique (business_id, invoice_number),
  unique (tenant_id, id)
);

create table sales_invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references sales_invoices(id),
  tenant_id uuid not null,
  variant_id uuid not null,
  quantity numeric(19,6) not null check (quantity > 0),
  unit_price numeric(19,4) not null check (unit_price >= 0),
  discount numeric(19,4) not null default 0 check (discount >= 0),
  tax numeric(19,4) not null default 0 check (tax >= 0),
  line_total numeric(19,4) not null check (line_total >= 0),
  foreign key (tenant_id, variant_id) references product_variants(tenant_id, id)
);

create table sales_payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  business_id uuid not null,
  invoice_id uuid not null references sales_invoices(id),
  method text not null check (method in ('cash', 'bank', 'mobile_money', 'credit')),
  amount numeric(19,4) not null check (amount > 0),
  reference text,
  status text not null default 'confirmed' check (status in ('pending', 'confirmed', 'reversed')),
  received_at timestamptz not null default now(),
  foreign key (tenant_id, business_id) references businesses(tenant_id, id)
);

create index sales_invoices_scope_idx on sales_invoices (tenant_id, business_id, location_id, created_at desc);
create index sales_invoice_items_invoice_idx on sales_invoice_items (invoice_id);
