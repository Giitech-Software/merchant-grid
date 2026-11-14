import type { RequestContext } from "../security/request-context.js";

export type CreateRoleInput = {
  name: string;
  description?: string;
  permissionCodes: readonly string[];
};

export type RoleRecord = {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  permissions?: readonly string[];
};

export interface RoleRepository {
  listPermissions(): Promise<readonly { code: string; description: string }[]>;
  listForTenant(context: RequestContext): Promise<readonly RoleRecord[]>;
  create(context: RequestContext, input: CreateRoleInput): Promise<RoleRecord>;
}
