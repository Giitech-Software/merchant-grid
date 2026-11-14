import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuditRepository } from "../repositories/audit-repository.js";
import { hasPermission } from "../security/request-context.js";
const querySchema = z.object({ businessId: z.string().uuid().optional(), limit: z.coerce.number().int().min(1).max(200).default(50), cursor: z.string().optional() });
export function registerAuditRoutes(app: FastifyInstance, repository: AuditRepository): void {
  app.get<{ Querystring: Record<string, unknown> }>("/v1/audit-events", async (request, reply) => {
    const context = request.requestContext;
    if (!context) return reply.code(401).send({ status: "unauthenticated" });
    if (!hasPermission(context, "audit.view")) return reply.code(403).send({ status: "forbidden" });
    const parsed = querySchema.safeParse(request.query);
    if (!parsed.success) return reply.code(400).send({ status: "invalid_request", issues: parsed.error.flatten() });
    return { data: await repository.list(context, parsed.data) };
  });
}
