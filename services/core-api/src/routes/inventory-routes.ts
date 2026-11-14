import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { InventoryRepository } from "../repositories/inventory-repository.js";
import { hasPermission } from "../security/request-context.js";
const movement = z.object({ locationId: z.string().uuid(), variantId: z.string().uuid(), quantity: z.string().regex(/^\d+(\.\d{1,6})?$/), unitCost: z.string().regex(/^\d+(\.\d{1,6})?$/), sourceType: z.string().min(1).max(50), sourceId: z.string().uuid(), idempotencyKey: z.string().min(8).max(200), reason: z.string().max(500).optional(), state: z.string().optional() });
export function registerInventoryRoutes(app: FastifyInstance, repository: InventoryRepository): void {
  const post = (path: string, operation: (context: any, input: any) => Promise<unknown>) => app.post<{ Body: unknown }>(path, async (request, reply) => { const context = request.requestContext; if (!context) return reply.code(401).send({ status: "unauthenticated" }); if (!hasPermission(context, "inventory.post")) return reply.code(403).send({ status: "forbidden" }); const parsed = movement.safeParse(request.body); if (!parsed.success) return reply.code(400).send({ status: "invalid_request", issues: parsed.error.flatten() }); return reply.code(201).send({ data: await operation(context, parsed.data) }); });
  post("/v1/inventory/receipts", (context, input) => repository.postReceipt(context, input));
  post("/v1/inventory/issues", (context, input) => repository.postIssue(context, input));
  post("/v1/inventory/adjustments", (context, input) => repository.postAdjustment(context, input));
  app.get<{ Querystring: { locationId: string; variantId: string } }>("/v1/inventory/balance", async (request, reply) => { const context = request.requestContext; if (!context) return reply.code(401).send({ status: "unauthenticated" }); if (!hasPermission(context, "product.view")) return reply.code(403).send({ status: "forbidden" }); return { data: await repository.getBalance(context, request.query.locationId, request.query.variantId) }; });
}
