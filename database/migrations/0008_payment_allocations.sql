create table payment_allocations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  business_id uuid not null,
  payment_id uuid not null references sales_payments(id),
  invoice_id uuid not null references sales_invoices(id),
  amount numeric(19,4) not null check (amount > 0),
  created_at timestamptz not null default now(),
  foreign key (tenant_id, business_id) references businesses(tenant_id, id),
  unique (payment_id, invoice_id)
);

create index payment_allocations_invoice_idx on payment_allocations (tenant_id, invoice_id);
