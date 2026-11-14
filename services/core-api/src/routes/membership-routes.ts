import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { MembershipRepository } from "../repositories/membership-repository.js";
import { hasPermission } from "../security/request-context.js";

const createMembershipSchema = z.object({
  userId: z.string().uuid(),
  businessId: z.string().uuid(),
  roleId: z.string().uuid(),
  locationId: z.string().uuid().optional(),
});

export function registerMembershipRoutes(app: FastifyInstance, repository: MembershipRepository): void {
  app.get("/v1/memberships", async (request, reply) => {
    const context = request.requestContext;
    if (!context) return reply.code(401).send({ status: "unauthenticated" });
    if (!hasPermission(context, "user.manage-access")) return reply.code(403).send({ status: "forbidden" });
    return { data: await repository.listForBusiness(context) };
  });

  app.post<{ Body: unknown }>("/v1/memberships", async (request, reply) => {
    const context = request.requestContext;
    if (!context) return reply.code(401).send({ status: "unauthenticated" });
    if (!hasPermission(context, "user.manage-access")) {
      return reply.code(403).send({ status: "forbidden" });
    }

    const parsed = createMembershipSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ status: "invalid_request", issues: parsed.error.flatten() });
    }

    try {
      const membership = await repository.create(context, parsed.data);
      return reply.code(201).send({ data: membership });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Membership could not be created";
      if (message.includes("already exists") || (error as { code?: string }).code === "23505") {
        return reply.code(409).send({ status: "conflict", message: "This membership already exists" });
      }
      if (message.includes("scope")) {
        return reply.code(400).send({ status: "invalid_scope", message: "Membership scope is invalid" });
      }
      throw error;
    }
  });
}
