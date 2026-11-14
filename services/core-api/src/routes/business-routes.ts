import type { FastifyInstance } from "fastify";
import type { BusinessRepository } from "../repositories/business-repository.js";
import { z } from "zod";
import { hasPermission } from "../security/request-context.js";

export function registerBusinessRoutes(app: FastifyInstance, repository: BusinessRepository): void {
  app.post<{ Body: unknown }>("/v1/businesses", async (request, reply) => {
    const context = request.requestContext;
    if (!context) return reply.code(401).send({ status: "unauthenticated" });
    if (!hasPermission(context, "business.configure")) return reply.code(403).send({ status: "forbidden" });
    const parsed = z.object({ name: z.string().trim().min(2).max(150), slug: z.string().regex(/^[a-z0-9-]+$/) }).safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ status: "invalid_request", issues: parsed.error.flatten() });
    try { return reply.code(201).send({ data: await repository.create(context, parsed.data) }); }
    catch (error) { if ((error as { code?: string }).code === "23505") return reply.code(409).send({ status: "conflict" }); throw error; }
  });

  app.get("/v1/businesses", async (request, reply) => {
    const context = request.requestContext;
    if (!context) return reply.code(401).send({ status: "unauthenticated" });
    if (!hasPermission(context, "business.view")) {
      return reply.code(403).send({ status: "forbidden" });
    }

    return { data: await repository.listForTenant(context) };
  });
}
