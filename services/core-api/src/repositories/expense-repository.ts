import type { RequestContext } from "../security/request-context.js";
export type PaymentAccountRecord={id:string;name:string;accountType:string;currency:string;status:string};
export type ExpenseRecord={id:string;payee:string;description:string;amount:string;status:string};
export type CreateExpenseInput={categoryId:string;paymentAccountId?:string;payee:string;description:string;amount:string};
export interface ExpenseRepository{listPaymentAccounts(context:RequestContext):Promise<readonly PaymentAccountRecord[]>;createExpense(context:RequestContext,input:CreateExpenseInput):Promise<ExpenseRecord>;approveExpense(context:RequestContext,id:string):Promise<ExpenseRecord>;payExpense(context:RequestContext,id:string):Promise<ExpenseRecord>;}
