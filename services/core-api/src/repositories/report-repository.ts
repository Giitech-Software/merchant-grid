import type { RequestContext } from "../security/request-context.js";
export type TrialBalanceRow={accountId:string;code:string;name:string;debit:string;credit:string};
export type BalanceSummary={total:string;count:number};
export interface ReportRepository{trialBalance(context:RequestContext):Promise<readonly TrialBalanceRow[]>;inventoryValuation(context:RequestContext):Promise<BalanceSummary>;receivables(context:RequestContext):Promise<BalanceSummary>;payables(context:RequestContext):Promise<BalanceSummary>;}
