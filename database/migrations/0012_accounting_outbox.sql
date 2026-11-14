create table accounting_outbox (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  business_id uuid not null,
  event_type text not null,
  source_type text not null,
  source_id uuid not null,
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'posted', 'failed')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  foreign key (tenant_id, business_id) references businesses(tenant_id, id),
  unique (tenant_id, event_type, source_type, source_id)
);

create index accounting_outbox_pending_idx on accounting_outbox (status, next_attempt_at);
