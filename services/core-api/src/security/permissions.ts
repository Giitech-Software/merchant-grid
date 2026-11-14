export const permissionCodes = [
  "business.view",
  "business.configure",
  "user.manage-access",
  "audit.view",
  "product.view",
  "product.create",
  "inventory.post",
  "sales.view",
  "sales.create",
  "sales.post",
  "accounting.post",
  "accounting.configure",
  "purchasing.view",
  "purchasing.create",
  "purchasing.approve",
  "expense.view",
  "expense.create",
  "expense.approve",
  "expense.pay",
  "catalogue.publish",
  "catalogue.enquiries.view",
  "catalogue.enquiries.manage",
] as const;

export type PermissionCode = (typeof permissionCodes)[number];

export class AuthorizationError extends Error {
  public readonly statusCode = 403;

  public constructor(message = "You do not have permission to perform this action") {
    super(message);
    this.name = "AuthorizationError";
  }
}
