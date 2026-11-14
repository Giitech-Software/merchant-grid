import type { RequestContext } from "../security/request-context.js";
export type StockMovementInput = { locationId: string; variantId: string; quantity: string; unitCost: string; sourceType: string; sourceId: string; idempotencyKey: string; reason?: string; state?: string };
export type StockBalance = { locationId: string; variantId: string; quantity: string; averageCost: string };
export interface InventoryRepository { postReceipt(context: RequestContext, input: StockMovementInput): Promise<StockBalance>; postIssue(context: RequestContext, input: StockMovementInput): Promise<StockBalance>; postAdjustment(context: RequestContext, input: StockMovementInput): Promise<StockBalance>; getBalance(context: RequestContext, locationId: string, variantId: string): Promise<StockBalance | null>; }
