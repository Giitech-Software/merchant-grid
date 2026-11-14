import type { Pool } from "pg";
import type { RequestContext } from "../security/request-context.js";
import type { CreateLocationInput, LocationRecord, LocationRepository } from "./location-repository.js";

export class PostgresLocationRepository implements LocationRepository {
  public constructor(private readonly pool: Pool) {}

  public async listForBusiness(context: RequestContext): Promise<readonly LocationRecord[]> {
    if (!context.businessId) throw new Error("A business context is required");
    const result = await this.pool.query<LocationRecord>(
      `select id, business_id as "businessId", name, code, kind, status
       from locations where tenant_id = $1 and business_id = $2 order by name asc`,
      [context.tenantId, context.businessId],
    );
    return result.rows;
  }

  public async create(context: RequestContext, input: CreateLocationInput): Promise<LocationRecord> {
    if (!context.businessId) throw new Error("A business context is required");
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const result = await client.query<LocationRecord>(
        `insert into locations (tenant_id, business_id, name, code, kind)
         select $1, id, $3, $4, coalesce($5, 'shop') from businesses
         where id = $2 and tenant_id = $1
         returning id, business_id as "businessId", name, code, kind, status`,
        [context.tenantId, context.businessId, input.name, input.code, input.kind ?? null],
      );
      const location = result.rows[0];
      if (!location) throw new Error("Location business scope is invalid");
      await client.query(
        `insert into audit_events (tenant_id, business_id, actor_user_id, action, target_type, target_id, after_data, context)
         values ($1, $2, $3, 'location.created', 'location', $4, $5::jsonb, $6::jsonb)`,
        [context.tenantId, context.businessId, context.userId, location.id, JSON.stringify(location), JSON.stringify({ requestId: context.requestId })],
      );
      await client.query("commit");
      return location;
    } catch (error) { await client.query("rollback"); throw error; } finally { client.release(); }
  }
}
