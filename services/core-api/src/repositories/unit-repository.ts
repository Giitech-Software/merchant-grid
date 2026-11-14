import type { RequestContext } from "../security/request-context.js";
export type UnitRecord = { id: string; code: string; name: string; symbol: string | null };
export type ConversionRecord = { id: string; variantId: string; fromUnitId: string; toUnitId: string; multiplier: string; effectiveFrom: string; effectiveTo: string | null };
export type CreateUnitInput = { code: string; name: string; symbol?: string };
export type CreateConversionInput = { variantId: string; fromUnitId: string; toUnitId: string; multiplier: string; effectiveFrom?: string; effectiveTo?: string };
export interface UnitRepository { list(context: RequestContext): Promise<readonly UnitRecord[]>; create(context: RequestContext, input: CreateUnitInput): Promise<UnitRecord>; createConversion(context: RequestContext, input: CreateConversionInput): Promise<ConversionRecord>; }
