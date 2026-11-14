import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { LocationRepository } from "../repositories/location-repository.js";
import { hasPermission } from "../security/request-context.js";
export function registerLocationRoutes(app: FastifyInstance, repository: LocationRepository): void {
  app.get("/v1/locations", async (request, reply) => {
    const context = request.requestContext;
    if (!context) return reply.code(401).send({ status: "unauthenticated" });
    if (!hasPermission(context, "business.view")) return reply.code(403).send({ status: "forbidden" });
    return { data: await repository.listForBusiness(context) };
  });
  app.post<{ Body: unknown }>("/v1/locations", async (request, reply) => {
    const context = request.requestContext;
    if (!context) return reply.code(401).send({ status: "unauthenticated" });
    if (!hasPermission(context, "business.configure")) return reply.code(403).send({ status: "forbidden" });
    const parsed = z.object({ name: z.string().trim().min(2).max(150), code: z.string().trim().min(1).max(30), kind: z.string().optional() }).safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ status: "invalid_request", issues: parsed.error.flatten() });
    return reply.code(201).send({ data: await repository.create(context, parsed.data) });
  });
}
