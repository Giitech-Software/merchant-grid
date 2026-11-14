import type { Pool } from "pg";
import type { RequestContext } from "../security/request-context.js";
import type { CreateRoleInput, RoleRecord, RoleRepository } from "./role-repository.js";

export class PostgresRoleRepository implements RoleRepository {
  public constructor(private readonly pool: Pool) {}

  public async listForTenant(context: RequestContext): Promise<readonly RoleRecord[]> {
    const result = await this.pool.query<RoleRecord>(
      `select id, tenant_id as "tenantId", name, description
       from roles where tenant_id = $1 order by name asc`,
      [context.tenantId],
    );
    return result.rows.map((role) => ({ ...role, permissions: [] }));
  }

  public async listPermissions(): Promise<readonly { code: string; description: string }[]> {
    const result = await this.pool.query<{ code: string; description: string }>(
      "select code, description from permissions order by code asc",
    );
    return result.rows;
  }

  public async create(context: RequestContext, input: CreateRoleInput): Promise<RoleRecord> {
    const client = await this.pool.connect();
    try {
      await client.query("begin");

      const permissions = await client.query<{ id: string; code: string }>(
        "select id, code from permissions where code = any($1::text[])",
        [input.permissionCodes],
      );
      const foundCodes = new Set(permissions.rows.map((permission) => permission.code));
      if (foundCodes.size !== new Set(input.permissionCodes).size || input.permissionCodes.some((code) => !foundCodes.has(code))) {
        throw new Error("Invalid permission code");
      }

      const inserted = await client.query<RoleRecord>(
        `insert into roles (tenant_id, name, description)
         values ($1, $2, $3)
         returning id, tenant_id as "tenantId", name, description`,
        [context.tenantId, input.name, input.description ?? null],
      );
      const role = inserted.rows[0];
      if (!role) throw new Error("Role insert did not return a record");

      for (const permission of permissions.rows) {
        await client.query(
          "insert into role_permissions (role_id, permission_id) values ($1, $2)",
          [role.id, permission.id],
        );
      }

      await client.query(
        `insert into audit_events
          (tenant_id, business_id, actor_user_id, action, target_type, target_id, after_data, context)
         values ($1, $2, $3, 'role.created', 'role', $4, $5::jsonb, $6::jsonb)`,
        [
          context.tenantId,
          context.businessId ?? null,
          context.userId,
          role.id,
          JSON.stringify({ ...role, permissions: input.permissionCodes }),
          JSON.stringify({ requestId: context.requestId }),
        ],
      );

      await client.query("commit");
      return { ...role, permissions: input.permissionCodes };
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }
}
