import type { RequestContext } from "../security/request-context.js";

export type BusinessSummary = {
  id: string;
  tenantId: string;
  name: string;
  status: "active" | "suspended" | "closed";
};
export type CreateBusinessInput = { name: string; slug: string };

/**
 * Repository methods receive the authenticated context first. Implementations
 * must use its tenant/business scope in every query; callers cannot supply a
 * free-standing tenant filter.
 */
export interface BusinessRepository {
  findById(context: RequestContext, businessId: string): Promise<BusinessSummary | null>;
  listForTenant(context: RequestContext): Promise<readonly BusinessSummary[]>;
  create(context: RequestContext, input: CreateBusinessInput): Promise<BusinessSummary>;
}
