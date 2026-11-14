import type { Pool } from "pg";
import type { RequestContext } from "../security/request-context.js";
import type { InventoryRepository, StockBalance, StockMovementInput } from "./inventory-repository.js";
export class PostgresInventoryRepository implements InventoryRepository {
  public constructor(private readonly pool: Pool) {}
  public postReceipt(c: RequestContext, i: StockMovementInput) { return this.post(c, i, Number(i.quantity)); }
  public postIssue(c: RequestContext, i: StockMovementInput) { return this.post(c, i, -Number(i.quantity)); }
  public postAdjustment(c: RequestContext, i: StockMovementInput) { return this.post(c, i, Number(i.quantity)); }
  private async post(context: RequestContext, input: StockMovementInput, signedQuantity: number): Promise<StockBalance> {
    if (!context.businessId) throw new Error("A business context is required");
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const existing = await client.query("select 1 from stock_ledger_entries where tenant_id=$1 and idempotency_key=$2", [context.tenantId, input.idempotencyKey]);
      if (existing.rowCount) throw new Error("Stock movement already exists");
      const balance = await client.query<StockBalance>("select location_id as \"locationId\", variant_id as \"variantId\", quantity::text, average_cost::text as \"averageCost\" from stock_balances where tenant_id=$1 and business_id=$2 and location_id=$3 and variant_id=$4 for update", [context.tenantId, context.businessId, input.locationId, input.variantId]);
      const current = balance.rows[0] ?? { locationId: input.locationId, variantId: input.variantId, quantity: "0", averageCost: "0" };
      const nextQuantity = Number(current.quantity) + signedQuantity;
      if (nextQuantity < 0) throw new Error("Insufficient stock");
      const nextCost = signedQuantity > 0 ? ((Number(current.quantity) * Number(current.averageCost)) + (signedQuantity * Number(input.unitCost))) / (nextQuantity || 1) : Number(current.averageCost);
      await client.query("insert into stock_ledger_entries (tenant_id,business_id,location_id,variant_id,movement_type,quantity,unit_cost,source_type,source_id,idempotency_key,reason,actor_user_id) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)", [context.tenantId, context.businessId, input.locationId, input.variantId, signedQuantity > 0 ? (input.sourceType === "adjustment" ? "adjustment" : "receipt") : "issue", signedQuantity, input.unitCost, input.sourceType, input.sourceId, input.idempotencyKey, input.reason ?? null, context.userId]);
      const saved = await client.query<StockBalance>("insert into stock_balances (tenant_id,business_id,location_id,variant_id,quantity,average_cost) values ($1,$2,$3,$4,$5,$6) on conflict (location_id,variant_id) do update set quantity=excluded.quantity, average_cost=excluded.average_cost, updated_at=now() returning location_id as \"locationId\",variant_id as \"variantId\",quantity::text,average_cost::text as \"averageCost\"", [context.tenantId, context.businessId, input.locationId, input.variantId, nextQuantity, nextCost]);
      await client.query("commit"); return saved.rows[0];
    } catch (error) { await client.query("rollback"); throw error; } finally { client.release(); }
  }
  public async getBalance(context: RequestContext, locationId: string, variantId: string): Promise<StockBalance | null> { const result = await this.pool.query<StockBalance>("select location_id as \"locationId\",variant_id as \"variantId\",quantity::text,average_cost::text as \"averageCost\" from stock_balances where tenant_id=$1 and business_id=$2 and location_id=$3 and variant_id=$4", [context.tenantId, context.businessId, locationId, variantId]); return result.rows[0] ?? null; }
}
