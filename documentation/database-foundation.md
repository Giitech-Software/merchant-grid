# Foundation data model

## Security invariants

1. Every business belongs to exactly one tenant.
2. Locations, roles, and memberships carry tenant scope and use composite foreign keys to prevent mismatched tenant references.
3. A membership grants access only to its business and optional location scope.
4. Authorization queries must always include tenant and business scope from the authenticated request context.
5. Audit events are append-only at the database trigger boundary.
6. A user email is unique case-insensitively; external identity subjects are unique when present.

## Initial permission vocabulary

The application layer should seed permissions using stable codes such as `business.view`, `business.configure`, `user.manage-access`, `audit.view`, `product.view`, `product.create`, `inventory.post`, and `sales.post`. Permission codes are API contracts and should not be renamed casually.

