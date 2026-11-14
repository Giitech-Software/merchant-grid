create table sales_returns (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  business_id uuid not null,
  location_id uuid not null,
  invoice_id uuid not null references sales_invoices(id),
  customer_id uuid,
  status text not null default 'draft' check (status in ('draft', 'approved', 'completed', 'voided')),
  reason text not null,
  refund_method text check (refund_method in ('cash', 'bank', 'mobile_money', 'credit_note')),
  refund_amount numeric(19,4) not null default 0 check (refund_amount >= 0),
  created_by uuid references users(id),
  approved_by uuid references users(id),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  completed_at timestamptz,
  foreign key (tenant_id, business_id) references businesses(tenant_id, id),
  foreign key (tenant_id, location_id) references locations(tenant_id, id),
  foreign key (tenant_id, customer_id) references customers(tenant_id, id)
);

create table sales_return_items (
  id uuid primary key default gen_random_uuid(),
  return_id uuid not null references sales_returns(id) on delete cascade,
  tenant_id uuid not null,
  variant_id uuid not null,
  quantity numeric(19,6) not null check (quantity > 0),
  disposition text not null check (disposition in ('sellable', 'damaged', 'quarantined', 'non_sellable')),
  unit_refund numeric(19,4) not null check (unit_refund >= 0),
  foreign key (tenant_id, variant_id) references product_variants(tenant_id, id)
);

create table credit_notes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  business_id uuid not null,
  customer_id uuid,
  return_id uuid unique references sales_returns(id),
  note_number text not null,
  amount numeric(19,4) not null check (amount > 0),
  status text not null default 'open' check (status in ('open', 'applied', 'voided')),
  created_at timestamptz not null default now(),
  foreign key (tenant_id, business_id) references businesses(tenant_id, id),
  foreign key (tenant_id, customer_id) references customers(tenant_id, id),
  unique (business_id, note_number)
);

create index sales_returns_invoice_idx on sales_returns (tenant_id, invoice_id, created_at desc);
