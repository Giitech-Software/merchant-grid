import type { Pool } from "pg";
import type { RequestContext } from "../security/request-context.js";
import type { CreateUserInput, UserRecord, UserRepository } from "./user-repository.js";

export class PostgresUserRepository implements UserRepository {
  public constructor(private readonly pool: Pool) {}

  public async list(context: RequestContext): Promise<readonly UserRecord[]> {
    const result = await this.pool.query<UserRecord>(
      `select distinct u.id, u.email, u.display_name as "displayName", u.status
       from users u join memberships m on m.user_id = u.id
       where m.tenant_id = $1 and m.status = 'active'
       order by u.display_name asc`,
      [context.tenantId],
    );
    return result.rows;
  }

  public async create(context: RequestContext, input: CreateUserInput): Promise<UserRecord> {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const result = await client.query<UserRecord>(
        `insert into users (email, display_name, external_subject)
         values ($1, $2, $3)
         returning id, email, display_name as "displayName", status`,
        [input.email, input.displayName, input.externalSubject ?? null],
      );
      const user = result.rows[0];
      if (!user) throw new Error("User insert did not return a record");
      await client.query(
        `insert into audit_events (tenant_id, business_id, actor_user_id, action, target_type, target_id, after_data, context)
         values ($1, $2, $3, 'user.created', 'user', $4, $5::jsonb, $6::jsonb)`,
        [context.tenantId, context.businessId ?? null, context.userId, user.id, JSON.stringify(user), JSON.stringify({ requestId: context.requestId })],
      );
      await client.query("commit");
      return user;
    } catch (error) { await client.query("rollback"); throw error; } finally { client.release(); }
  }

  public async deactivate(context: RequestContext, userId: string): Promise<UserRecord> {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const result = await client.query<UserRecord>(
        `update users set status = 'deactivated', updated_at = now() where id = $1
         returning id, email, display_name as "displayName", status`, [userId],
      );
      const user = result.rows[0];
      if (!user) throw new Error("User not found");
      await client.query(
        `insert into audit_events (tenant_id, business_id, actor_user_id, action, target_type, target_id, after_data, context)
         values ($1, $2, $3, 'user.deactivated', 'user', $4, $5::jsonb, $6::jsonb)`,
        [context.tenantId, context.businessId ?? null, context.userId, user.id, JSON.stringify(user), JSON.stringify({ requestId: context.requestId })],
      );
      await client.query("commit");
      return user;
    } catch (error) { await client.query("rollback"); throw error; } finally { client.release(); }
  }
}
