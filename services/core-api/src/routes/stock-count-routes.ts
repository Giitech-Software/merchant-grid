import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { StockCountRepository } from "../repositories/stock-count-repository.js";
import { hasPermission } from "../security/request-context.js";
const schema = z.object({ locationId: z.string().uuid(), items: z.array(z.object({ variantId: z.string().uuid(), countedQuantity: z.string().regex(/^\d+(\.\d{1,6})?$/), reason: z.string().max(500).optional() })).min(1) });
export function registerStockCountRoutes(app: FastifyInstance, repository: StockCountRepository): void {
  app.post<{ Body: unknown }>("/v1/inventory/counts", async (request, reply) => { const c=request.requestContext; if (!c) return reply.code(401).send({ status: "unauthenticated" }); if (!hasPermission(c,"inventory.post")) return reply.code(403).send({ status: "forbidden" }); const p=schema.safeParse(request.body); if (!p.success) return reply.code(400).send({ status:"invalid_request",issues:p.error.flatten() }); return reply.code(201).send({ data: await repository.create(c,p.data) }); });
  app.post<{ Params: { countId: string } }>("/v1/inventory/counts/:countId/approve", async (request, reply) => { const c=request.requestContext; if (!c) return reply.code(401).send({ status:"unauthenticated" }); if (!hasPermission(c,"inventory.post")) return reply.code(403).send({ status:"forbidden" }); return { data: await repository.approve(c,request.params.countId) }; });
  app.post<{ Params: { countId: string } }>("/v1/inventory/counts/:countId/reconcile", async (request, reply) => { const c=request.requestContext; if (!c) return reply.code(401).send({ status:"unauthenticated" }); if (!hasPermission(c,"inventory.post")) return reply.code(403).send({ status:"forbidden" }); return { data: await repository.reconcile(c,request.params.countId) }; });
}
