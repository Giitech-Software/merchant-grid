import type { RequestContext } from "../security/request-context.js";

export type CreateMembershipInput = {
  userId: string;
  businessId: string;
  roleId: string;
  locationId?: string;
};

export type MembershipRecord = CreateMembershipInput & {
  id: string;
  tenantId: string;
  status: "active" | "suspended" | "revoked";
  locationId?: string | null;
};

export interface MembershipRepository {
  listForBusiness(context: RequestContext): Promise<readonly MembershipRecord[]>;
  create(context: RequestContext, input: CreateMembershipInput): Promise<MembershipRecord>;
}
