create table stock_balances (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  business_id uuid not null,
  location_id uuid not null,
  variant_id uuid not null,
  quantity numeric(19,6) not null default 0,
  average_cost numeric(19,6) not null default 0,
  updated_at timestamptz not null default now(),
  foreign key (tenant_id, business_id) references businesses(tenant_id, id),
  foreign key (tenant_id, location_id) references locations(tenant_id, id),
  foreign key (tenant_id, variant_id) references product_variants(tenant_id, id),
  unique (location_id, variant_id)
);

create table stock_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  business_id uuid not null,
  location_id uuid not null,
  variant_id uuid not null,
  movement_type text not null check (movement_type in ('receipt', 'issue', 'sale', 'purchase_return', 'sales_return', 'transfer_in', 'transfer_out', 'adjustment', 'write_off')),
  quantity numeric(19,6) not null check (quantity <> 0),
  unit_cost numeric(19,6) not null default 0 check (unit_cost >= 0),
  state text not null default 'sellable' check (state in ('sellable', 'damaged', 'expired', 'quarantined', 'non_sellable')),
  source_type text not null,
  source_id uuid not null,
  idempotency_key text not null,
  reason text,
  actor_user_id uuid references users(id),
  occurred_at timestamptz not null default now(),
  foreign key (tenant_id, business_id) references businesses(tenant_id, id),
  foreign key (tenant_id, location_id) references locations(tenant_id, id),
  foreign key (tenant_id, variant_id) references product_variants(tenant_id, id),
  unique (tenant_id, idempotency_key)
);

create index stock_ledger_scope_idx on stock_ledger_entries (tenant_id, business_id, location_id, variant_id, occurred_at desc);
create index stock_balances_lookup_idx on stock_balances (business_id, location_id, variant_id);

create or replace function prevent_stock_ledger_mutation() returns trigger language plpgsql as $$
begin
  raise exception 'stock_ledger_entries are append-only; use a reversal or adjustment';
end;
$$;

create trigger stock_ledger_entries_no_update before update or delete on stock_ledger_entries
for each row execute function prevent_stock_ledger_mutation();
