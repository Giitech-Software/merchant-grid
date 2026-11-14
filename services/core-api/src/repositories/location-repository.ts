import type { RequestContext } from "../security/request-context.js";
export type LocationRecord = { id: string; businessId: string; name: string; code: string; kind: string; status: string };
export type CreateLocationInput = { name: string; code: string; kind?: string };
export interface LocationRepository {
  listForBusiness(context: RequestContext): Promise<readonly LocationRecord[]>;
  create(context: RequestContext, input: CreateLocationInput): Promise<LocationRecord>;
}
