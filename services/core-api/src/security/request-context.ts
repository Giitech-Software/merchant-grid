import type { PermissionCode } from "./permissions.js";

export type RequestContext = {
  requestId: string;
  tenantId: string;
  userId: string;
  businessId?: string;
  locationId?: string;
  permissions: Set<string>;
};

export function requireBusinessContext(context: RequestContext): string {
  if (!context.businessId) {
    throw new Error("A business context is required for this operation");
  }

  return context.businessId;
}

export function hasPermission(context: RequestContext, permission: PermissionCode): boolean {
  return context.permissions.has(permission);
}
