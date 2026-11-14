import type { Pool } from "pg";
import type { PermissionCode } from "../security/permissions.js";
import type { MembershipSessionResolver, VerifiedSession } from "./session-context.js";

type MembershipRow = {
  user_id: string;
  tenant_id: string;
  business_id: string;
  location_id: string | null;
  permission_code: PermissionCode;
};

export class PostgresMembershipResolver implements MembershipSessionResolver {
  public constructor(private readonly pool: Pool) {}

  public async resolve(userId: string): Promise<VerifiedSession | null> {
    const result = await this.pool.query<MembershipRow>(
      `select m.user_id, m.tenant_id, m.business_id, m.location_id, p.code as permission_code
       from memberships m
       join users u on u.id = m.user_id and u.status = 'active'
       join role_permissions rp on rp.role_id = m.role_id
       join permissions p on p.id = rp.permission_id
       where u.external_subject = $1 and m.status = 'active'
       order by m.created_at asc`,
      [userId],
    );

    const first = result.rows[0];
    if (!first) return null;

    const scopedRows = result.rows.filter(
      (row) =>
        row.tenant_id === first.tenant_id &&
        row.business_id === first.business_id &&
        row.location_id === first.location_id,
    );

    return {
      userId: first.user_id,
      tenantId: first.tenant_id,
      businessId: first.business_id,
      ...(first.location_id ? { locationId: first.location_id } : {}),
      permissions: new Set(scopedRows.map((row) => row.permission_code)),
    };
  }
}
