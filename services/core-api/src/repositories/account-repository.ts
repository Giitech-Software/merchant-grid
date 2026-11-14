import type { RequestContext } from "../security/request-context.js";
export type AccountRecord = { id: string; code: string; name: string; accountType: string; status: string };
export type CreateAccountInput = { code: string; name: string; accountType: "asset"|"liability"|"equity"|"income"|"expense"; parentId?: string };
export interface AccountRepository { list(context: RequestContext): Promise<readonly AccountRecord[]>; create(context: RequestContext, input: CreateAccountInput): Promise<AccountRecord>; seedDefaults(context: RequestContext): Promise<readonly AccountRecord[]>; }
