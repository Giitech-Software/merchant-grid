create table payment_accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  business_id uuid not null,
  name text not null,
  account_type text not null check (account_type in ('cash', 'bank', 'mobile_money')),
  currency text not null default 'GHS',
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  foreign key (tenant_id, business_id) references businesses(tenant_id, id),
  unique (tenant_id, id),
  unique (business_id, name)
);

create table expense_categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  business_id uuid not null,
  name text not null,
  account_id uuid,
  foreign key (tenant_id, business_id) references businesses(tenant_id, id),
  foreign key (tenant_id, account_id) references chart_of_accounts(tenant_id, id),
  unique (tenant_id, id),
  unique (business_id, name)
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  business_id uuid not null,
  category_id uuid not null,
  payment_account_id uuid,
  payee text not null,
  description text not null,
  amount numeric(19,4) not null check (amount > 0),
  status text not null default 'draft' check (status in ('draft', 'approved', 'paid', 'voided')),
  incurred_at timestamptz not null default now(),
  approved_by uuid references users(id),
  paid_by uuid references users(id),
  created_at timestamptz not null default now(),
  foreign key (tenant_id, business_id) references businesses(tenant_id, id),
  foreign key (tenant_id, category_id) references expense_categories(tenant_id, id),
  foreign key (tenant_id, payment_account_id) references payment_accounts(tenant_id, id)
);

create index expenses_scope_idx on expenses (tenant_id, business_id, incurred_at desc);
