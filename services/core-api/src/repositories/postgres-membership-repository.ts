import type { Pool } from "pg";
import type { RequestContext } from "../security/request-context.js";
import type {
  CreateMembershipInput,
  MembershipRecord,
  MembershipRepository,
} from "./membership-repository.js";

export class PostgresMembershipRepository implements MembershipRepository {
  public constructor(private readonly pool: Pool) {}

  public async listForBusiness(context: RequestContext): Promise<readonly MembershipRecord[]> {
    if (!context.businessId) throw new Error("A business context is required");
    const result = await this.pool.query<MembershipRecord>(
      `select id, tenant_id as "tenantId", business_id as "businessId", user_id as "userId",
              role_id as "roleId", location_id as "locationId", status
       from memberships
       where tenant_id = $1 and business_id = $2
       order by created_at asc`,
      [context.tenantId, context.businessId],
    );
    return result.rows;
  }

  public async create(context: RequestContext, input: CreateMembershipInput): Promise<MembershipRecord> {
    if (input.businessId !== context.businessId) {
      throw new Error("Membership business must match the active business context");
    }

    const client = await this.pool.connect();
    try {
      await client.query("begin");

      const scope = await client.query(
        `select
           exists (select 1 from businesses where id = $1 and tenant_id = $2) as business_exists,
           exists (select 1 from roles where id = $3 and tenant_id = $2) as role_exists,
           exists (
             select 1 from locations
             where id = $4 and business_id = $1 and tenant_id = $2
           ) as location_exists`,
        [input.businessId, context.tenantId, input.roleId, input.locationId ?? null],
      );
      const row = scope.rows[0] as {
        business_exists: boolean;
        role_exists: boolean;
        location_exists: boolean;
      };

      if (!row.business_exists || !row.role_exists || (input.locationId && !row.location_exists)) {
        throw new Error("Membership scope is invalid");
      }

      const inserted = await client.query<MembershipRecord>(
        `insert into memberships (tenant_id, business_id, user_id, role_id, location_id)
         values ($1, $2, $3, $4, $5)
         returning id, tenant_id as "tenantId", business_id as "businessId",
                   user_id as "userId", role_id as "roleId", location_id as "locationId", status`,
        [context.tenantId, input.businessId, input.userId, input.roleId, input.locationId ?? null],
      );
      const membership = inserted.rows[0];
      if (!membership) throw new Error("Membership insert did not return a record");

      await client.query(
        `insert into audit_events
          (tenant_id, business_id, actor_user_id, action, target_type, target_id, after_data, context)
         values ($1, $2, $3, 'membership.created', 'membership', $4, $5::jsonb, $6::jsonb)`,
        [
          context.tenantId,
          input.businessId,
          context.userId,
          membership.id,
          JSON.stringify(membership),
          JSON.stringify({ requestId: context.requestId }),
        ],
      );

      await client.query("commit");
      return membership;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }
}
