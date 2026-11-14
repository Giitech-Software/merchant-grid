import type { RequestContext } from "../security/request-context.js";
export type AccountMapping = { mappingKey: string; accountId: string };
export interface AccountMappingRepository { list(context: RequestContext): Promise<readonly AccountMapping[]>; set(context: RequestContext, mapping: AccountMapping): Promise<AccountMapping>; get(context: RequestContext, mappingKey: string): Promise<string | null>; }
