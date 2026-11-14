import type { Pool } from "pg";
import type { RequestContext } from "../security/request-context.js";
import { AutomaticPostingService } from "./automatic-posting.js";

type OutboxEvent = { id: string; tenant_id: string; business_id: string; event_type: string; source_id: string; payload: { total?: string; costOfGoodsSold?: string; amount?: string } };

export class AccountingOutboxWorker {
  public constructor(private readonly pool: Pool, private readonly posting: AutomaticPostingService) {}
  public async processOne(): Promise<boolean> {
    const client = await this.pool.connect();
    let eventId = "";
    try {
      await client.query("begin");
      const result = await client.query<OutboxEvent>("select id,tenant_id,business_id,event_type,source_id,payload from accounting_outbox where status='pending' and next_attempt_at <= now() order by created_at for update skip locked limit 1");
      const event = result.rows[0];
      if (!event) { await client.query("rollback"); return false; }
      eventId = event.id;
      await client.query("update accounting_outbox set status='processing',attempts=attempts+1 where id=$1", [event.id]);
      await client.query("commit");
      const context: RequestContext = { requestId: `outbox:${event.id}`, userId: "system", tenantId: event.tenant_id, businessId: event.business_id, permissions: new Set(["accounting.post"]) };
      if (event.event_type === "sale.posted") await this.posting.postSale(context, event.source_id, event.payload.total ?? "0", event.payload.costOfGoodsSold ?? "0");
      else if (event.event_type === "customer.payment") await this.posting.postCollection(context, event.source_id, event.payload.amount ?? "0");
      else throw new Error(`Unsupported accounting event: ${event.event_type}`);
      await this.pool.query("update accounting_outbox set status='posted',processed_at=now() where id=$1", [event.id]);
      return true;
    } catch (error) {
      await client.query("rollback").catch(() => undefined);
      await this.pool.query("update accounting_outbox set status='failed',last_error=$2,next_attempt_at=now() + interval '5 minutes' where id=$1", [eventId, error instanceof Error ? error.message : "Unknown error"]).catch(() => undefined);
      return false;
    } finally { client.release(); }
  }
}
