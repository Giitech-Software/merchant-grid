create table supplier_payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  business_id uuid not null,
  supplier_invoice_id uuid not null references supplier_invoices(id),
  method text not null check (method in ('cash', 'bank', 'mobile_money')),
  amount numeric(19,4) not null check (amount > 0),
  reference text,
  status text not null default 'confirmed' check (status in ('pending', 'confirmed', 'reversed')),
  created_at timestamptz not null default now(),
  foreign key (tenant_id, business_id) references businesses(tenant_id, id)
);

create index supplier_payments_invoice_idx on supplier_payments (tenant_id, supplier_invoice_id);
