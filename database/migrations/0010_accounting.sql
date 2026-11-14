create table chart_of_accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  business_id uuid not null,
  code text not null,
  name text not null,
  account_type text not null check (account_type in ('asset', 'liability', 'equity', 'income', 'expense')),
  parent_id uuid,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  foreign key (tenant_id, business_id) references businesses(tenant_id, id),
  foreign key (parent_id) references chart_of_accounts(id),
  unique (business_id, code),
  unique (tenant_id, id)
);

create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  business_id uuid not null,
  entry_number text not null,
  status text not null default 'draft' check (status in ('draft', 'posted', 'reversed')),
  source_type text not null,
  source_id uuid not null,
  description text not null,
  posted_by uuid references users(id),
  posted_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (tenant_id, business_id) references businesses(tenant_id, id),
  unique (business_id, entry_number),
  unique (tenant_id, id)
);

create table journal_lines (
  id uuid primary key default gen_random_uuid(),
  journal_entry_id uuid not null references journal_entries(id),
  tenant_id uuid not null,
  account_id uuid not null,
  description text,
  debit numeric(19,4) not null default 0 check (debit >= 0),
  credit numeric(19,4) not null default 0 check (credit >= 0),
  foreign key (tenant_id, account_id) references chart_of_accounts(tenant_id, id),
  check ((debit = 0 and credit > 0) or (credit = 0 and debit > 0))
);

create index journal_entries_scope_idx on journal_entries (tenant_id, business_id, created_at desc);
create index journal_lines_account_idx on journal_lines (tenant_id, account_id);

create or replace function prevent_posted_journal_mutation() returns trigger language plpgsql as $$
begin
  if old.status = 'posted' then raise exception 'posted journal entries are immutable'; end if;
  return new;
end;
$$;

create trigger journal_entries_no_posted_update before update on journal_entries
for each row execute function prevent_posted_journal_mutation();
