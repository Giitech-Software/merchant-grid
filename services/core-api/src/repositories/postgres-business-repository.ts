import type { Pool } from "pg";
import type { BusinessRepository, BusinessSummary, CreateBusinessInput } from "./business-repository.js";
import { requireBusinessContext, type RequestContext } from "../security/request-context.js";

export class PostgresBusinessRepository implements BusinessRepository {
  public constructor(private readonly pool: Pool) {}

  public async create(context: RequestContext, input: CreateBusinessInput): Promise<BusinessSummary> {
    const result = await this.pool.query<BusinessSummary>(
      `insert into businesses (tenant_id, name, slug) values ($1, $2, $3)
       returning id, tenant_id as "tenantId", name, status`,
      [context.tenantId, input.name, input.slug],
    );
    const business = result.rows[0];
    if (!business) throw new Error("Business insert did not return a record");
    return business;
  }

  public async findById(context: RequestContext, businessId: string): Promise<BusinessSummary | null> {
    // Tenant scope is always bound from the authenticated context.
    const result = await this.pool.query<BusinessSummary>(
      `select id, tenant_id as "tenantId", name, status
       from businesses
       where tenant_id = $1 and id = $2`,
      [context.tenantId, businessId],
    );

    return result.rows[0] ?? null;
  }

  public async listForTenant(context: RequestContext): Promise<readonly BusinessSummary[]> {
    const result = await this.pool.query<BusinessSummary>(
      `select id, tenant_id as "tenantId", name, status
       from businesses
       where tenant_id = $1
       order by name asc`,
      [context.tenantId],
    );

    return result.rows;
  }

  public async findCurrentBusiness(context: RequestContext): Promise<BusinessSummary | null> {
    return this.findById(context, requireBusinessContext(context));
  }
}
