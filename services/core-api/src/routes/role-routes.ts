import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { RoleRepository } from "../repositories/role-repository.js";
import { hasPermission } from "../security/request-context.js";

const createRoleSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional(),
  permissionCodes: z.array(z.string().trim().min(1)).min(1).max(100),
});

export function registerRoleRoutes(app: FastifyInstance, repository: RoleRepository): void {
  app.get("/v1/roles", async (request, reply) => {
    const context = request.requestContext;
    if (!context) return reply.code(401).send({ status: "unauthenticated" });
    if (!hasPermission(context, "user.manage-access")) return reply.code(403).send({ status: "forbidden" });
    return { data: await repository.listForTenant(context) };
  });

  app.get("/v1/permissions", async (request, reply) => {
    const context = request.requestContext;
    if (!context) return reply.code(401).send({ status: "unauthenticated" });
    if (!hasPermission(context, "user.manage-access")) return reply.code(403).send({ status: "forbidden" });
    return { data: await repository.listPermissions() };
  });

  app.post<{ Body: unknown }>("/v1/roles", async (request, reply) => {
    const context = request.requestContext;
    if (!context) return reply.code(401).send({ status: "unauthenticated" });
    if (!hasPermission(context, "user.manage-access")) return reply.code(403).send({ status: "forbidden" });

    const parsed = createRoleSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ status: "invalid_request", issues: parsed.error.flatten() });

    try {
      return reply.code(201).send({ data: await repository.create(context, parsed.data) });
    } catch (error) {
      if (error instanceof Error && error.message.includes("permission")) {
        return reply.code(400).send({ status: "invalid_permission", message: "One or more permissions are invalid" });
      }
      if ((error as { code?: string }).code === "23505") {
        return reply.code(409).send({ status: "conflict", message: "A role with this name already exists" });
      }
      throw error;
    }
  });
}
