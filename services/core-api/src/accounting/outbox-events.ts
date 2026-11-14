import type { PoolClient } from "pg";

export type AccountingOutboxEvent = {
  tenantId: string;
  businessId: string;
  eventType: "sale.posted" | "customer.payment" | "supplier.payment" | "expense.posted";
  sourceType: string;
  sourceId: string;
  payload: Record<string, unknown>;
};

export async function enqueueAccountingEvent(client: PoolClient, event: AccountingOutboxEvent): Promise<void> {
  await client.query(`insert into accounting_outbox (tenant_id,business_id,event_type,source_type,source_id,payload) values ($1,$2,$3,$4,$5,$6::jsonb) on conflict (tenant_id,event_type,source_type,source_id) do nothing`, [event.tenantId,event.businessId,event.eventType,event.sourceType,event.sourceId,JSON.stringify(event.payload)]);
}
