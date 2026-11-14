import type { RequestContext } from "../security/request-context.js";
export type JournalLineInput = { accountId: string; description?: string; debit?: string; credit?: string };
export type PostJournalInput = { sourceType: string; sourceId: string; description: string; lines: readonly JournalLineInput[] };
export type JournalRecord = { id: string; entryNumber: string; status: string; total: string };
export interface AccountingRepository { postJournal(context: RequestContext, input: PostJournalInput): Promise<JournalRecord>; }
