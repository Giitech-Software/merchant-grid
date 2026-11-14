import type { Pool } from "pg";
import type { RequestContext } from "../security/request-context.js";
import type { AuditEvent, AuditPage, AuditQuery, AuditRepository } from "./audit-repository.js";
export class PostgresAuditRepository implements AuditRepository {
  public constructor(private readonly pool: Pool) {}
  public async list(context: RequestContext, query: AuditQuery): Promise<AuditPage> {
    const decoded = query.cursor ? Buffer.from(query.cursor, "base64url").toString("utf8").split("|") : [];
    const cursorDate = decoded[0] ?? null;
    const cursorId = decoded[1] ?? null;
    const result = await this.pool.query<AuditEvent>(
      `select id, business_id as "businessId", actor_user_id as "actorUserId", action, target_type as "targetType",
              target_id as "targetId", reason, context, occurred_at as "occurredAt"
       from audit_events where tenant_id = $1 and ($2::uuid is null or business_id = $2)
         and ($3::timestamptz is null or (occurred_at, id) < ($3::timestamptz, $4::uuid))
       order by occurred_at desc, id desc limit $5`,
      [context.tenantId, query.businessId ?? null, cursorDate, cursorId, (query.limit ?? 50) + 1],
    );
    const hasMore = result.rows.length > (query.limit ?? 50);
    const items = hasMore ? result.rows.slice(0, query.limit ?? 50) : result.rows;
    const last = items.at(-1);
    return {
      items,
      ...(hasMore && last ? { nextCursor: Buffer.from(`${last.occurredAt}|${last.id}`).toString("base64url") } : {}),
    };
  }
}
