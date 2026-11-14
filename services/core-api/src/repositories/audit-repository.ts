import type { RequestContext } from "../security/request-context.js";
export type AuditEvent = { id: string; businessId: string | null; actorUserId: string | null; action: string; targetType: string; targetId: string | null; reason: string | null; context: Record<string, unknown>; occurredAt: string };
export type AuditQuery = { businessId?: string; limit?: number; cursor?: string };
export type AuditPage = { items: readonly AuditEvent[]; nextCursor?: string };
export interface AuditRepository { list(context: RequestContext, query: AuditQuery): Promise<AuditPage>; }
