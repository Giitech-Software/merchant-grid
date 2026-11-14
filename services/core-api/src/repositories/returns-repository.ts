import type { RequestContext } from "../security/request-context.js";
export type ReturnItemInput = { variantId: string; quantity: string; disposition: "sellable" | "damaged" | "quarantined" | "non_sellable"; unitRefund: string };
export type CreateReturnInput = { invoiceId: string; locationId: string; reason: string; refundMethod?: "cash" | "bank" | "mobile_money" | "credit_note"; items: readonly ReturnItemInput[] };
export type ReturnRecord = { id: string; invoiceId: string; status: string; refundAmount: string };
export interface ReturnsRepository { create(context: RequestContext, input: CreateReturnInput): Promise<ReturnRecord>; approve(context: RequestContext, returnId: string): Promise<ReturnRecord>; complete(context: RequestContext, returnId: string): Promise<ReturnRecord>; }
