alter table sales_invoices add column cogs_total numeric(19,4) not null default 0;

create or replace function enqueue_sale_accounting_event() returns trigger language plpgsql as $$
declare
  calculated_cogs numeric(19,4);
begin
  if new.status = 'posted' and old.status <> 'posted' then
    select coalesce(sum(items.quantity * balances.average_cost), 0)
      into calculated_cogs
      from sales_invoice_items items
      join stock_balances balances on balances.tenant_id = new.tenant_id
       and balances.business_id = new.business_id and balances.location_id = new.location_id
       and balances.variant_id = items.variant_id
     where items.invoice_id = new.id;
    update sales_invoices set cogs_total = calculated_cogs where id = new.id;
    insert into accounting_outbox (tenant_id, business_id, event_type, source_type, source_id, payload)
    values (
      new.tenant_id,
      new.business_id,
      'sale.posted',
      'sales_invoice',
      new.id,
      jsonb_build_object('total', new.total::text, 'costOfGoodsSold', calculated_cogs::text)
    )
    on conflict (tenant_id, event_type, source_type, source_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger sales_invoice_accounting_outbox
after update of status on sales_invoices
for each row execute function enqueue_sale_accounting_event();
