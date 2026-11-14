import type { RequestContext } from "../security/request-context.js";
export type StockCountItemInput = { variantId: string; countedQuantity: string; reason?: string };
export type CreateStockCountInput = { locationId: string; items: readonly StockCountItemInput[] };
export type StockCountSummary = { id: string; locationId: string; status: string; createdAt: string };
export interface StockCountRepository { create(context: RequestContext, input: CreateStockCountInput): Promise<StockCountSummary>; approve(context: RequestContext, countId: string): Promise<StockCountSummary>; reconcile(context: RequestContext, countId: string): Promise<StockCountSummary>; }
